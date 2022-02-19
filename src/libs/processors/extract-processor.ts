import { Walker } from '@prisma/client'
import { CheerioAPI } from 'cheerio'
import Logger from '../../utils/logger'
import WalkManager from '../walk-manager'

export default class ExtractProcessor {
  /**
   * 抽出処理を実行する.
   *
   * @param {CheerioAPI} $ DOM要素
   * @param {Walker} walker 使用している walker
   * @param {WalkManager} manager 管理マネージャー
   * @returns void
   */
  public async exec($: CheerioAPI, walker: Walker, manager: WalkManager): Promise<void> {
    // set で重複禁止
    const set = new Set<string>()

    // 属性を基準に URL を抜き出す
    $('[href]').each((i, el) => {
      const url = $(el).attr('href')
      if (url) set.add(url)
    })
    $('[src]').each((i, el) => {
      const url = $(el).attr('src')
      if (url) set.add(url)
    })

    // 配列に変換
    let links = [...set]
    Logger.debug('> extract links: %d', links.length)

    // URL フィルターを通す
    const urlFilter = walker.urlFilter
    if (urlFilter) {
      const matcher = new RegExp(urlFilter)
      links = links.filter((link) => matcher.test(link))
      Logger.debug('> filtered links: %d', links.length)
    }

    // キューに追加
    manager.addQueues(links)
  }
}
