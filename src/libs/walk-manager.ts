import { Page } from '@prisma/client'
import PageRepository from '../repositories/page-repository'
import QueueRepository from '../repositories/queue-repository'
import { SiteWithRelations } from '../repositories/site-repository'
import DumpUtil from '../utils/dump-util'
import HttpUtil from '../utils/http-util'
import Logger from '../utils/logger'
import ExtractProcessor from './processors/extract-processor'

export default class WalkManager {
  private site: SiteWithRelations

  private processors = {
    extract: new ExtractProcessor(),
  }

  constructor(site: SiteWithRelations) {
    this.site = site
  }

  /**
   * 1ステップ実行する.
   *
   * @returns void
   */
  public async step(): Promise<void> {
    // キューから一つ取り出す
    const page = await QueueRepository.deque(this.site)
    if (!page) throw new ReferenceError('queue is empty.')

    Logger.debug('STEP <%s> %s', this.site.key, page.url)

    // dom に変換
    const $ = await HttpUtil.fetch(page.url)

    // 一致する walker に対して処理をする
    for await (const walker of this.site.walkers) {
      const matcher = new RegExp(walker.urlPattern)
      if (matcher.test(page.url)) {
        Logger.debug('> 🔍 walker: <%s> %s', walker.name, walker.processor)

        // プロセッサーを実行
        switch (walker.processor) {
          case 'extract':
            await this.processors.extract.exec($, walker, this)
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
    await QueueRepository.clearQueue(this.site)

    // ルート要素をキューに入れる
    const rootPage = await PageRepository.upsert(this.site, this.site.url, this.site.title)
    await QueueRepository.addQueueByPage(this.site, rootPage)
    Logger.debug('> <%s> add root page: %s', this.site.key, DumpUtil.page(rootPage))
  }

  ///

  public async addQueues(urls: string[], parent?: Page): Promise<void> {
    for await (const url of urls) {
      const page = await QueueRepository.addQueue(url, this.site, parent)
      console.log(page)
    }
  }
}
