import { PrismaClient, Site } from '@prisma/client'
import { WalkResult } from '../libs/walk-switcher'
import { SiteConfig } from '../loaders/site-config-schema'

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

  ///

  /**
   * サイトの統計情報を更新する.
   *
   * @param {Site} site サイト
   * @param {WalkResult} result walk処理の結果
   * @returns {Promise<Site>} 更新したサイトレコード
   */
  public static async updateStats(site: Site, result: WalkResult): Promise<Site> {
    const updSite = await prisma.site.update({
      where: { id: site.id },
      data: {
        cntStep: { increment: 1 },
        cntWalker: { increment: result.walker },
        cntExtract: { increment: result.extract },
        cntImage: { increment: result.image },
      },
    })

    return updSite
  }

  /**
   * SiteConfig を使ってレコードを保存して、再取得.
   *
   * key を基準に更新します。
   * @param {SiteConfig} siteConfig サイト設定
   * @returns {Promise<Site>} 保存後のSiteレコード
   */
  public static async upsertByConfig(siteConfig: SiteConfig): Promise<Site> {
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
