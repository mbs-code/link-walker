import { Page, PrismaClient, Site } from '@prisma/client'
import DumpUtil from '../utils/dump-util'
import Logger from '../utils/logger'

const prisma = new PrismaClient()

export default class PageRepository {
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
   * ページを作成・更新する.
   *
   * @param {Site} site サイト情報
   * @param {string} url URL
   * @param {string?} title ページタイトル
   * @returns {Promise<Page>} 作成・更新したページ
   */
  public static async upsert(site: Site, url: string, title?: string): Promise<Page> {
    const data = {
      siteId: site.id,
      url: url,
      title: title,
    }

    // unique要素でしか検索できないため、IDを探してから upsert する
    const exists = await PageRepository.findOne(site, url)
    const page = await prisma.page.upsert({
      where: { id: exists?.id },
      create: data,
      update: data,
    })

    Logger.trace('> <%s> db:upsert:page %s', site.key, DumpUtil.page(page))

    return page
  }
}
