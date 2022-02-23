import { Page, Queue, Site } from '@prisma/client'
import { SiteConfig } from '../loaders/site-config-schema'
import PageRepository from '../repositories/page-repository'
import QueueRepository from '../repositories/queue-repository'
import SiteRepository from '../repositories/site-repository'
import WalkerStat from '../stats/walker-stat'
import DumpUtil from '../utils/dump-util'
import HttpUtil from '../utils/http-util'
import Logger from '../utils/logger'
import ExtractProcessor from './processors/extract-processor'
import ImageProcessor from './processors/image-processor'
import WalkAgent from './walk-agent'
import WalkSwitcher from './walk-switcher'

/** walker 動作設定 */
export type WalkOption = {
  peek?: boolean
}

/** ダンプデータ */
export type WalkDump = {
  config: SiteConfig
  site: Site
  pages: Page[]
  queues: Queue[]
}

export default class WalkManager {
  private config: SiteConfig
  private site: Site
  private usePeek: boolean

  private switcher: WalkSwitcher
  private agent: WalkAgent // processor がアクセスする先

  private processors = {
    extract: new ExtractProcessor(),
    image: new ImageProcessor(),
  }

  constructor(config: SiteConfig, site: Site, options?: WalkOption) {
    this.config = config
    this.site = site
    this.switcher = new WalkSwitcher(config)
    this.agent = new WalkAgent(site)

    this.usePeek = options?.peek ?? false
  }

  /**
   * 1ステップ実行する.
   *
   * @param {Number} step ステップ回数
   * @param {Number} maxStep 最大ステップ回数
   * @returns {Promise<WalkerStat>} 統計
   */
  public async step(step: number, maxStep: number): Promise<WalkerStat> {
    // キューから一つ取り出す
    const queue = await QueueRepository.peek(this.site)
    Logger.info('<%s> [%d/%d] STEP: %s', this.site.key, step, maxStep, DumpUtil.queue(queue, '--'))

    // キューが空ならエラー（自動追加は無限ループになってしまう）
    if (!queue) throw new ReferenceError('Queue is empty.')

    // ページと親要素を取り出す(referrer のため)
    let page = queue.page
    const parent = await PageRepository.findParent(page)

    // HTTP アクセスを行って DOM に変換する
    const { $, title } = await HttpUtil.fetch(page.url, parent?.url)

    // タイトルをページに書き込む
    Logger.trace('<%s> Write title on page.', this.site.key)
    page.title = title ?? ''
    page = await PageRepository.upsert(this.site, page)

    // ★ 一致する processor を選んで実行する
    Logger.trace('<%s> Search walker.', this.site.key)
    const stat = await this.switcher.exec(this.agent, page, $)

    // キューからページを削除する
    if (this.usePeek) {
      Logger.trace('<%s> Skip Deque.', this.site.key)
    } else {
      Logger.trace('<%s> Deque.', this.site.key)
      await QueueRepository.remove(this.site, queue)
    }

    // サイトに統計情報を記録する
    Logger.trace('<%s> Update site stats.', this.site.key)
    this.site = await SiteRepository.updateStats(this.site, stat)

    Logger.info('<%s> [%d/%d] RESULT: %s', this.site.key, step, maxStep, stat.dump())
    return stat
  }

  /**
   * キューを初期化する.
   *
   * @returns void
   */
  public async resetQueue(): Promise<void> {
    Logger.debug('<%s> Reset queue.', this.site.key)

    // キューを空にする
    await QueueRepository.clear(this.site)

    // ルート要素をキューに入れる
    const root = await this.agent.upsertRootPage()
    await QueueRepository.addQueue(this.site, root)

    Logger.debug('<%s> Enque root page. %s', this.site.key, DumpUtil.page(root))
  }

  /**
   * キューとページを初期化する.
   *
   * @returns void
   */
  public async clearPage(): Promise<void> {
    Logger.debug('<%s> Clear all page.', this.site.key)

    // ページ（とキュー）を空にする
    await PageRepository.clear(this.site)

    // ルート要素をキューに入れる
    const root = await this.agent.upsertRootPage()
    await QueueRepository.addQueue(this.site, root)

    Logger.debug('<%s> Enque root page. %s', this.site.key, DumpUtil.page(root))
  }

  ///

  /**
   * 管理データをすべてダンプする.
   *
   * @returns {Promise<WalkDump>} ダンプデータ
   */
  public async dump(): Promise<WalkDump> {
    // DBの要素をすべて取り出す
    const pages = await PageRepository.findAll(this.site)
    const queues = await QueueRepository.findAll(this.site)

    return {
      config: this.config,

      site: this.site,
      pages: pages,
      queues: queues,
    }
  }
}
