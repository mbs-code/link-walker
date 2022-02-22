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
    Logger.info('⚙ file %s', filePath)

    return config
  }

  /**
   * ファイルからサイトWalkerを生成する.
   * @param {string} filePath ファイルパス
   * @param {WalkOption} option 起動オプション
   * @returns {Promise<WalkManager>} 実処理インスタンス
   */
  public static async load(filePath: string, option?: WalkOption): Promise<WalkManager> {
    // ファイル読み込み
    const config = await SiteConfigLoader.loadfile(filePath)

    // DB インスタンス探索
    const site = await SiteRepository.upsertByConfig(config)
    Logger.info('💾 DB %s', DumpUtil.site(site))

    // 実処理インスタンス を作成
    const walk = new WalkManager(config, site, option)
    Logger.debug('create walk insatance')

    return walk
  }
}
