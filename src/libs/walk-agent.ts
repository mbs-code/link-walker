import { Page } from '@prisma/client'
import PageRepository from '../repositories/page-repository'
import QueueRepository from '../repositories/queue-repository'
import { SiteWithWalkers } from '../repositories/site-repository'
import DumpUtil from '../utils/dump-util'
import Logger from '../utils/logger'

export default class WalkAgent {
  private site: SiteWithWalkers

  constructor(site: SiteWithWalkers) {
    this.site = site
  }

  /**
   * キューにルートページを挿入する.
   *
   * @returns void
   */
  public async insertQueueByRoot(): Promise<void> {
    // ルートページの作成＆キューに入れる
    const rootPage = await PageRepository.upsertRaw(this.site, this.site.url, this.site.title)
    await QueueRepository.addQueueByPage(this.site, rootPage)

    Logger.debug('> <%s> add root page: %s', this.site.key, DumpUtil.page(rootPage))
  }

  /**
   * キューにURLを追加する.
   *
   * 既に処理したURLは無視されます。
   * @param {string[]} urls URL配列
   * @param {Page?} parent 親ページ要素
   * @returns {number} 追加に成功した数
   */
  public async addQueues(urls: string[], parent?: Page): Promise<number> {
    let success = 0

    for await (const url of urls) {
      const page = await QueueRepository.addQueue(url, this.site, parent)
      if (page) success++
    }

    return success
  }
}
