import { Site } from '@prisma/client'
import WalkManager, { WalkOption } from '../libs/walk-manager'
import SiteRepository from '../repositories/site-repository'
import DumpUtil from '../utils/dump-util'
import FileUtil from '../utils/file-util'
import Logger from '../utils/logger'
import { SiteConfig, siteConfigSchema } from './site-config-schema'

export default class SiteConfigLoader {
  /**
   * ファイルからサイト設定を読み込む.
   * @param {string} filePath ファイルパス
   * @returns {Promise<SiteConfig>} サイト設定
   */
  public static async loadfile(filePath: string): Promise<SiteConfig> {
    // ファイル読み込み
    const config = (await FileUtil.loadYaml(filePath, siteConfigSchema)) as SiteConfig
    Logger.debug('File loaded: %s', filePath)

    return config
  }

  /**
   * ファイルからサイトWalkerを生成する.
   *
   * @param {string} filePath ファイルパス
   * @param {WalkOption} option 起動オプション
   * @returns {Promise<{ manager: WalkManager, site: Site}>} 実処理インスタンス
   */
  public static async load(filePath: string, option?: WalkOption): Promise<{ manager: WalkManager; site: Site }> {
    // ファイル読み込み
    const config = await SiteConfigLoader.loadfile(filePath)

    // DB インスタンス探索＆更新
    const site = await SiteRepository.upsertByConfig(config)
    Logger.debug('DB Loaded: %s', DumpUtil.site(site))

    // 実処理インスタンス を作成
    const manager = new WalkManager(config, site, option)
    Logger.debug('Create walk insatance. %s', site.key)

    return { manager, site }
  }
}
