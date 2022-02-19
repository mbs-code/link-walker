import PageRepository from '../repositories/page-repository'
import QueueRepository from '../repositories/queue-repository'
import { SiteWithWalkers } from '../repositories/site-repository'
import HttpUtil from '../utils/http-util'
import Logger from '../utils/logger'
import ExtractProcessor from './processors/extract-processor'
import WalkAgent from './walk-agent'

export type WalkOptions = {
  peek?: boolean
}

export default class WalkManager {
  private site: SiteWithWalkers
  private usePeek: boolean

  private agent: WalkAgent

  private processors = {
    extract: new ExtractProcessor(),
  }

  constructor(site: SiteWithWalkers, options?: WalkOptions) {
    this.site = site
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
    const page = await QueueRepository.deque(this.site, this.usePeek)
    if (!page) throw new ReferenceError('queue is empty.')

    Logger.debug('STEP <%s> %s', this.site.key, page.url)

    // dom に変換
    const $ = await HttpUtil.fetch(page.url)

    // 一致する walker に対して処理をする
    for await (const walker of this.site.walkers) {
      const matcher = new RegExp(walker.urlPattern)
      if (matcher.test(page.url)) {
        Logger.debug('🔍 walker: <%s> %s', walker.name, walker.processor)

        // プロセッサーを実行
        switch (walker.processor) {
          case 'extract':
            await this.processors.extract.exec($, page, walker, this.agent)
            break
          case 'image':
          default:
            throw new ReferenceError(`${walker.processor} is not defined.`)
        }
      }
    }
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
}
