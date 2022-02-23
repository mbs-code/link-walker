import { Page, Queue, Site } from '@prisma/client'
import { CheerioAPI } from 'cheerio'
import { WalkerConfig } from '../loaders/site-config-schema'
import PageRepository from '../repositories/page-repository'
import QueueRepository from '../repositories/queue-repository'
import Logger from '../utils/logger'

export default class WalkAgent {
  public site: Site

  constructor(site: Site) {
    this.site = site
  }

  /**
   * DOM から URL を抽出する.
   *
   * @param {CheerioAPI} $ DOM 要素
   * @param {WalkerConfig} walker 使用している walker 設定
   * @returns {string[]} URL配列
   */
  public async extractLinks($: CheerioAPI, walker: WalkerConfig): Promise<string[]> {
    // set で重複禁止
    const set = new Set<string>()

    // DOM から URL を抜き出す (指定が無ければURLっぽいの全部)
    const domQuery = walker.queryFilter ?? '[href],[src]'
    Logger.trace('<%s> [url:search] %s', this.site.key, domQuery)

    $(domQuery).each((i, el) => {
      const href = $(el).attr('href')
      if (href) set.add(href)

      const src = $(el).attr('src')
      if (src) set.add(src)
    })

    // 配列に変換
    let links = [...set]
    Logger.trace('<%s> [url:extract] %d items', this.site.key, links.length)

    // URL フィルターを通す
    const urlFilter = walker.urlFilter
    if (urlFilter) {
      const matcher = new RegExp(urlFilter)
      links = links.filter((link) => matcher.test(link))

      Logger.trace('<%s> [url:filter] %d items', this.site.key, links.length)
    }

    return links
  }

  /**
   * 未処理のページか判定する
   *
   * @param {Page | null} page ページ
   * @return {boolean} true で未処理のpage
   */
  public isUnprocessedPage(page?: Page | null): boolean {
    if (page) {
      return !page.walker && !page.processor
    }

    return true
  }

  ///

  /**
   * ページを取得する.
   *
   * @param {string} url URL
   * @returns {Promise<Page | null>} ページ要素
   */
  public async findPage(url: string): Promise<Page | null> {
    const page = await PageRepository.findOne(this.site, url)
    return page
  }

  /**
   * 親要素とするページを取得.
   *
   * 設定によってgenerationをたどる。
   * @param {Page} parent 基準となるページ
   * @param {WalkerConfig} walker 使用している walker 設定
   * @returns {Promise<Page | null>} URL配列
   */
  public async getVirtualParentPage(parent: Page, walker: WalkerConfig): Promise<Page | null> {
    // 親の参照数(1で直属の親)
    const gen = walker.addParentGen ?? 0
    let page: Page | null = parent
    for (let i = 0; i < gen; i++) {
      // eslint-disable-next-line no-await-in-loop
      page = await PageRepository.findParent(page)
    }

    return page
  }

  ///

  /**
   * ページを作成する.
   *
   * @param {WalkerConfig} walker 使用している walker 設定
   * @param {string} url URL
   * @param {string?} title タイトル
   * @param {Page?} parent 親ページ要素
   * @returns {number} 追加に成功した数
   */
  public async upsertPage(walker: WalkerConfig, url: string, title?: string, parent?: Page): Promise<Page> {
    const page = await PageRepository.upsert(this.site, {
      siteId: this.site.id,
      parentId: parent?.id ?? null,
      url: url,
      title: title ?? null,
      walker: walker.key,
      processor: walker.processor,
    })

    return page
  }

  /**
   * キューに追加する.
   *
   * @param {WalkerConfig} walker 使用している walker 設定
   * @param {Page} page 追加するページ
   * @returns {Promise<Queue>} 追加したキュー
   */
  public async addQueue(walker: WalkerConfig, page: Page): Promise<Queue> {
    const queue = await QueueRepository.addQueue(this.site, page, walker.priority)
    return queue
  }

  /**
   * ルートページを作成・更新して取得する.
   *
   * @returns {Promise<Page>} ルートページ
   */
  public async upsertRootPage(): Promise<Page> {
    // ルートページの作成＆更新
    const rootPage = await PageRepository.upsert(this.site, {
      siteId: this.site.id,
      parentId: null,
      url: this.site.url,
      title: this.site.title,
      walker: null,
      processor: null,
    })
    return rootPage
  }
}
