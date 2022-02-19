import { PrismaClient, Site } from '@prisma/client'
import Logger from '../utils/logger'

const prisma = new PrismaClient()

export default class SiteRepository {
  /**
   * Siteレコードを全て取得する.
   *
   * @returns {Promise<Sites>} Siteレコード配列
   */
  public static async findAll(): Promise<Site[]> {
    const sites = await prisma.site.findMany({
      orderBy: [{ id: 'asc' }],
    })

    return sites
  }

  /**
   * Siteレコードを取得する.
   *
   * @param {string} code ID or KEYY
   * @returns {Promise<Site>} Siteレコード
   */
  public static async findOrFail(code?: string | number): Promise<Site> {
    const id = Number(code)
    const key = String(code)

    const site = await prisma.site.findFirst({
      where: {
        OR: [{ id: Number.isNaN(id) ? undefined : id }, { key: key }],
      },
    })
    if (!site) throw new ReferenceError(`${code} is not found.`)

    return site
  }

  /**
   * KEY を基準に、Siteレコードを保存する.
   *
   * @param {Site} siteItem Siteコード
   * @returns {Promise<Site>} 保存後のSiteレコード
   */
  public static async upsertByKey(siteItem: Site): Promise<Site> {
    const site = await prisma.site.upsert({
      where: {
        key: siteItem.key ?? undefined,
      },
      create: siteItem,
      update: siteItem,
    })
    Logger.debug('db: %s', JSON.stringify(site))

    return site
  }
}
