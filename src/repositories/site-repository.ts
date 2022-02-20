import { PrismaClient, Site, Walker } from '@prisma/client'
import DumpUtil from '../utils/dump-util'
import Logger from '../utils/logger'
import { SiteConfig } from '../utils/site-config-schema'

const prisma = new PrismaClient()

export type SiteWithWalkers = Site & {
  walkers: Walker[]
}

export default class SiteRepository {
  /**
   * Siteレコードを全て取得する.
   *
   * @returns {Promise<SiteWithWalkers>} Siteレコード配列
   */
  public static async findAll(): Promise<SiteWithWalkers[]> {
    const sites = await prisma.site.findMany({
      orderBy: [{ id: 'asc' }],
      include: {
        walkers: true,
      },
    })

    return sites
  }

  /**
   * Siteレコードを取得する.
   *
   * @param {string} code ID or KEYY
   * @returns {Promise<SiteWithWalkers>} Siteレコード
   */
  public static async findOrFail(code?: string | number): Promise<SiteWithWalkers> {
    const id = Number(code)
    const key = String(code)

    const site = await prisma.site.findFirst({
      where: {
        OR: [{ id: Number.isNaN(id) ? undefined : id }, { key: key }],
      },
      include: {
        walkers: true,
      },
    })
    if (!site) throw new ReferenceError(`${code} is not found.`)

    return site
  }

  /**
   * SiteConfig を使ってレコードを保存する.
   *
   * key を基準に更新します。
   * @param {SiteConfig} siteConfig Siteコード
   * @returns {Promise<SiteWithWalkers>} 保存後のSiteレコード
   */
  public static async upsertBySiteConfig(siteConfig: SiteConfig): Promise<SiteWithWalkers> {
    // Site の upsert
    const site = await prisma.site.upsert({
      where: {
        key: siteConfig.site.key ?? undefined,
      },
      create: siteConfig.site,
      update: siteConfig.site,
    })

    // Walkers の置き換え（順番が重要なので全消し + 追加)
    const data = await prisma.site.update({
      where: {
        id: site.id,
      },
      data: {
        walkers: {
          deleteMany: {},
          create: siteConfig.walkers,
        },
      },
      include: {
        walkers: true,
      },
    })
    Logger.trace('> <%s> db:create:site %s', data.key, DumpUtil.site(data))

    return data
  }
}
