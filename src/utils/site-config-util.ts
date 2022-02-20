import yaml from 'js-yaml'
import { promises } from 'fs'
import path from 'path'
import Logger from './logger'
import { Schema, SiteConfig } from './site-config-schema'

export default class SiteConfigUtil {
  /**
   * 相対パスを絶対パスに変換する.
   *
   * @param {string} filePath ファイルパス
   * @returns {string} cwd 基準の絶対パス
   */
  public static fullpath(filePath: string): string {
    // カレントディレクトリを基準に絶対パスを構築
    const cwd = process.cwd()
    const fullPath = path.join(cwd, filePath)

    return fullPath
  }

  /**
   * サイト設定YAMLを読み込む.
   *
   * @param {string} filePath ファイルパス
   * @returns {Promise<SiteConfig>} サイト
   */
  public static async load(filePath: string): Promise<SiteConfig> {
    Logger.debug('path: "%s"', filePath)

    // ファイル読み込み
    const data = await promises.readFile(filePath, 'utf-8')

    // yaml パース
    const doc = yaml.load(data)

    // バリデ＆型整形
    const { walkers, ...site } = await Schema.validateAsync(doc)
    const siteConfig: SiteConfig = { site, walkers }

    Logger.debug('yaml: %s', JSON.stringify(siteConfig))

    return siteConfig
  }
}
