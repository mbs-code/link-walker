import { Page, Queue, Site } from '@prisma/client'
import { SiteConfig } from '../loaders/site-config-schema'
import PageRepository from '../repositories/page-repository'
import QueueRepository from '../repositories/queue-repository'
import HttpUtil from '../utils/http-util'
import Logger from '../utils/logger'
import ExtractProcessor from './processors/extract-processor'
import ImageProcessor from './processors/image-processor'
import WalkAgent from './walk-agent'
import WalkSwitcher from './walk-switcher'

export type WalkOption = {
  peek?: boolean
}

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
   * @returns void
   */
  public async step(): Promise<void> {
    // キューから一つ取り出す
    let page = await QueueRepository.deque(this.site, this.usePeek)
    if (!page) throw new ReferenceError('queue is empty.')

    Logger.debug('STEP <%s> %s', this.site.key, page.url)

    // dom に変換
    const $ = await HttpUtil.fetch(page.url)

    // タイトルが取れたら保存しておく
    const title = $('title').text()
    if (title) {
      page.title = title.replace(/\r?\n/g, '').trim() // 改行コード、前後のスペースは消す
      page = await PageRepository.upsert(this.site, page)
    }

    // 一致する processor を選んで実行する
    await this.switcher.exec(this.agent, page, $)
  }

  /**
   * キューを初期化する.
   *
   * @returns void
   */
  public async resetQueue(): Promise<void> {
    Logger.debug('RESET QUEUE <%s>', this.site.key)

    // キューを空にする
    await QueueRepository.clear(this.site)

    // ルート要素をキューに入れる
    await this.agent.insertQueueByRoot()
  }

  /**
   * キューとページを初期化する.
   *
   * @returns void
   */
  public async clearPage(): Promise<void> {
    Logger.debug('CLEAR ALL PAGE <%s>', this.site.key)

    // ページ（とキュー）を空にする
    await PageRepository.clear(this.site)

    // ルート要素をキューに入れる
    await this.agent.insertQueueByRoot()
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
