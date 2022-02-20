import { PrismaClient, Site } from '@prisma/client'
import { SiteConfig } from '../apps/site-config-schema'
// import DumpUtil from '../utils/dump-util'
// import Logger from '../utils/logger'

const prisma = new PrismaClient()

export default class SiteRepository {
  /**
   * Siteレコードを取得する.
   *
   * @param {string} key キー
   * @returns {Promise<Site | nul>} Siteレコード配列
   */
  public static async findOne(key: string): Promise<Site | null> {
    const site = await prisma.site.findUnique({
      where: { key: key },
    })

    return site
  }

  /**
   * Siteレコードを全て取得する.
   *
   * @returns {Promise<Site>} Siteレコード配列
   */
  public static async findAll(): Promise<Site[]> {
    const sites = await prisma.site.findMany({
      orderBy: [{ id: 'asc' }],
    })

    return sites
  }

  /**
   * SiteConfig を使ってレコードを保存する.
   *
   * key を基準に更新します。
   * @param {SiteConfig} siteConfig サイト設定
   * @returns {Promise<Site>} 保存後のSiteレコード
   */
  public static async upsert(siteConfig: SiteConfig): Promise<Site> {
    // 更新用データ構築
    const data = {
      key: siteConfig.key,
      url: siteConfig.url,
      title: siteConfig.title,
    }

    // key を基準にして Site の upsert
    const site = await prisma.site.upsert({
      where: { key: siteConfig.key },
      create: data,
      update: data,
    })

    return site
  }
}
