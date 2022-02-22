import { Page, Prisma, PrismaClient, Site } from '@prisma/client'
import DumpUtil from '../utils/dump-util'
import Logger from '../utils/logger'
import QueueRepository from './queue-repository'

export type PageProps = {
  parentId?: number
  title?: string
  walker?: string
  processor?: string
}

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
   * ページを作成・更新する.
   *
   * @param {Site} site サイト情報
   * @param {Prisma.PageUncheckedCreateInput} pageProp 更新するページ要素
   * @returns {Promise<Page>} 作成・更新したページ
   */
  public static async upsert(site: Site, pageProp: Prisma.PageUncheckedCreateInput): Promise<Page> {
    const page = await prisma.page.upsert({
      where: { id: pageProp?.id ?? 0 },
      create: pageProp,
      update: pageProp,
    })

    Logger.trace('> <%s> db:upsert:page %s', site.key, DumpUtil.page(page))

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
