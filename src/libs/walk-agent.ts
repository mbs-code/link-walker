import { Page, Walker } from '@prisma/client'
import { CheerioAPI } from 'cheerio'
import PageRepository from '../repositories/page-repository'
import QueueRepository from '../repositories/queue-repository'
import { SiteWithWalkers } from '../repositories/site-repository'
import DumpUtil from '../utils/dump-util'
import Logger from '../utils/logger'

export default class WalkAgent {
  public site: SiteWithWalkers

  constructor(site: SiteWithWalkers) {
    this.site = site
  }

  /**
   * DOM から URL を抽出する.
   *
   * @param {CheerioAPI} $ DOM 要素
   * @param {Walker} walker 使用している walker
   * @returns {string[]} URL配列
   */
  public async extractLinks($: CheerioAPI, walker: Walker): Promise<string[]> {
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
    Logger.debug('> <%s> extract links: %d items', this.site.key, links.length)

    // URL フィルターを通す
    const urlFilter = walker.urlFilter
    if (urlFilter) {
      const matcher = new RegExp(urlFilter)
      links = links.filter((link) => matcher.test(link))
      Logger.debug('> <%s> filtered links: %d items', this.site.key, links.length)
    }

    return links
  }

  /**
   * DB に存在しないURLのみにフィルターする.
   *
   * @param {string[]} urls URL配列
   * @returns {Promise<Page | null>} 取得したページ
   */
  public async filteredNonExistUrls(urls: string[]): Promise<string[]> {
    // DBを検索する
    const dbPages = await PageRepository.findMany(this.site, urls)

    // DBに存在しないURLのみ返却する
    const nonExistUrls = urls.filter((url) => !dbPages.some((page) => page.url === url))
    Logger.debug('> <%s> filtered new links: %d items', this.site.key, nonExistUrls.length)

    return nonExistUrls
  }

  ///

  /**
   * ページを作成する.
   *
   * 既に処理したURLは上書きされます。
   * @param {string} url URL
   * @param {string?} title タイトル
   * @param {Page?} parent 親ページ要素
   * @returns {number} 追加に成功した数
   */
  public async createPage(url: string, title?: string, parent?: Page): Promise<Page> {
    const page = await PageRepository.upsertRaw(this.site, url, title, parent)
    return page
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
    // 既に存在するURLを取り除く
    const newLinks = await this.filteredNonExistUrls(urls)

    // キューに追加する
    let success = 0
    for await (const link of newLinks) {
      const page = await QueueRepository.addQueueByNewUrl(this.site, link, parent)
      if (page) success++
    }

    Logger.debug('> <%s> add queue links: %d items', this.site.key, success)
    return success
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
}
