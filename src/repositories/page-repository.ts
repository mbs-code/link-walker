import { Page, PrismaClient, Site } from '@prisma/client'
import DumpUtil from '../utils/dump-util'
import Logger from '../utils/logger'
import QueueRepository from './queue-repository'

const prisma = new PrismaClient()

export default class PageRepository {
  /**
   * URLに該当するページを取得する.
   *
   * @param {Site} site サイト情報
   * @param {string} url URL
   * @returns {Promise<Page | null>} DBに存在したページ
   */
  public static async findOne(site: Site, url: string): Promise<Page | null> {
    // Page が存在するか確認する
    const page = await prisma.page.findFirst({
      where: {
        siteId: site.id,
        url: url,
      },
    })

    return page
  }

  /**
   * URLに該当するページをすべて取得する.
   *
   * @param {Site} site サイト情報
   * @param {string[]} urls URL配列
   * @returns {Promise<Page[]>} DBに存在したページ配列
   */
  public static async findMany(site: Site, urls: string[]): Promise<Page[]> {
    // 存在するページをすべて取得する
    const pages = await prisma.page.findMany({
      where: {
        siteId: site.id,
        url: { in: urls },
      },
    })

    return pages
  }

  /**
   * サイトのページをすべて取得する.
   *
   * @param {Site} site サイト情報
   * @returns {Promise<Page[]>} DBに存在したページ配列
   */
  public static async findAll(site: Site): Promise<Page[]> {
    // 存在するページをすべて取得する
    const pages = await prisma.page.findMany({
      where: { siteId: site.id },
      orderBy: [{ id: 'asc' }],
    })

    return pages
  }

  /**
   * 親ページを取得する.
   *
   * @param {Page} page ページ要素
   * @returns {Promise<Page | null>} DBに存在したページ
   */
  public static async findParent(page?: Page | null): Promise<Page | null> {
    // 親のページが存在するか確認する
    const parent = await prisma.page.findUnique({
      where: {
        id: page?.parentId ?? 0,
      },
    })

    return parent
  }

  ///

  /**
   * 値からページを作成・更新する.
   *
   * @param {Site} site サイト情報
   * @param {string} url URL
   * @param {string?} title ページタイトル
   * @param {Page?} parent 親要素
   * @returns {Promise<Page>} 作成・更新したページ
   */
  public static async upsertRaw(site: Site, url: string, title?: string, parent?: Page): Promise<Page> {
    // TODO: upsert と共通化したい
    const data = {
      siteId: site.id,
      pageId: parent?.id ?? null,
      url: url,
      title: title,
    }

    // unique要素でしか検索できないため、IDを探してから upsert する
    const exists = await PageRepository.findOne(site, url)
    const page = await prisma.page.upsert({
      where: { id: exists?.id ?? 0 },
      create: data,
      update: data,
    })

    Logger.trace('> <%s> db:upsert:page %s', site.key, DumpUtil.page(page))

    return page
  }

  /**
   * ページを作成・更新する.
   *
   * @param {Site} site サイト情報
   * @param {Page} page 更新するページ要素
   * @returns {Promise<Page>} 作成・更新したページ
   */
  public static async upsert(site: Site, page: Page): Promise<Page> {
    const data = await prisma.page.upsert({
      where: { id: page?.id ?? 0 },
      create: page,
      update: page,
    })

    Logger.trace('> <%s> db:upsert:page %s', site.key, DumpUtil.page(data))

    return page
  }

  /**
   * ページを空にする.
   *
   * キューも削除されます。
   * @param {Site} site サイト情報
   * @returns void
   */
  public static async clear(site: Site): Promise<void> {
    // キューの全削除
    await QueueRepository.clear(site)

    // ページの全削除
    const pages = await prisma.page.deleteMany({
      where: { siteId: site.id },
    })

    Logger.trace('> <%s> db:delete:page %s items', site.key, pages.count)
  }
}
