import { SiteWithRelations } from '../repositories/site-repository'
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
    // TODO: キューからURLを一つ取り出す
    const url = this.site.url

    Logger.debug('STEP <%s> %s', this.site.key, url)

    // dom に変換
    const $ = await HttpUtil.fetch(url)

    // 一致する walker に対して処理をする
    for await (const walker of this.site.walkers) {
      const matcher = new RegExp(walker.urlPattern)
      if (matcher.test(url)) {
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

  public addQueues(urls: string[]): void {
    console.log(urls) // TODO
  }
}
