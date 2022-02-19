import { Site } from '@prisma/client'
import Joi from 'joi'
import yaml from 'js-yaml'
import { promises } from 'fs'
import path from 'path'

const SiteSchema = Joi.object({
  key: Joi.string(),
  title: Joi.string().required(),
  url: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .required(),
})

export default class ConfigUtil {
  /**
   * 相対パスを絶対パスに変換する.
   *
   * @param {string} filePath ファイルパス
   * @returns {string} cwd 基準の絶対パス
   */
  public static fullpath(filePath: string): string {
    // カレントディレクトリ
    const cwd = process.cwd()

    const fullPath = path.join(cwd, filePath)
    return fullPath
  }

  /**
   * サイト設定YAMLを読み込む.
   *
   * @param {string} filePath ファイルパス
   * @returns {Promise<Site>} サイト
   */
  public static async load(filePath: string): Promise<Site> {
    // ファイル読み込み
    const data = await promises.readFile(filePath, 'utf-8')
    // yaml パース
    const doc = yaml.load(data)
    // バリデ
    const site = (await SiteSchema.validateAsync(doc)) as Site
    return site
  }
}
