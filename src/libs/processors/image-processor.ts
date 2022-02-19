import { Page, Walker } from '@prisma/client'
import { CheerioAPI } from 'cheerio'
import Logger from '../../utils/logger'
import WalkAgent from '../walk-agent'

export default class ImageProcessor {
  /**
   * 画像保存処理を実行する.
   *
   * @param {CheerioAPI} $ DOM要素
   * @param {Parent} parent 親ページ
   * @param {Walker} walker 使用している walker
   * @param {WalkAgent} agent Walkエージェント
   * @returns void
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async exec($: CheerioAPI, parent: Page, walker: Walker, agent: WalkAgent): Promise<void> {
    // set で重複禁止
    const set = new Set<string>()

    // DOM から URL を抜き出す (指定が無ければURLっぽいの全部)
    const query = walker.queryFilter ?? '[href],[src]'
    $(query).each((i, el) => {
      const href = $(el).attr('href')
      if (href) set.add(href)

      const src = $(el).attr('src')
      if (src) set.add(src)
    })

    // 配列に変換
    let links = [...set]
    Logger.debug('> extract links: %d items', links.length)

    // URL フィルターを通す
    const urlFilter = walker.urlFilter
    if (urlFilter) {
      const matcher = new RegExp(urlFilter)
      links = links.filter((link) => matcher.test(link))
      Logger.debug('> filtered links: %d items', links.length)
    }

    console.log(links)

    // キューに追加
    // 返り値が null なら既に処理したURL
    // const count = await agent.addQueues(links, parent)
    // Logger.debug('> add queue links: %d items', count)
  }
}
