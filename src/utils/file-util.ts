import { promises } from 'fs'
import { Schema } from 'joi'
import yaml from 'js-yaml'
import prettyBytes from 'pretty-bytes'
import Logger from './logger'

export default class FileUtil {
  /**
   * YAMLファイルを読み込む.
   *
   * @param {string} filePath ファイルパス
   * @param {Schema} schema validator
   * @returns {Promise<Record<string, any>>} object
   */
  public static async loadYaml(filePath: string, schema: Schema): Promise<Record<string, any>> {
    Logger.trace('file:load %s', filePath)

    // ファイル読み込み
    const data = await promises.readFile(filePath, 'utf-8')

    // yaml パース＆バリデーション
    const doc = yaml.load(data)
    const valid = await schema.validateAsync(doc)

    return valid
  }

  /**
   * ファイルを保存する.
   *
   * @param {string} filePath filePath
   * @param {Buffer} buffer 保存するデータ
   * @returns {Promise<string>} full path
   */
  public static async writeBuffer(filePath: string, buffer: Buffer): Promise<string> {
    Logger.trace('file:write %s', filePath)
    await promises.writeFile(filePath, buffer)

    const size = prettyBytes(buffer.byteLength)
    Logger.trace('file:write:size %s', filePath, size)

    return filePath
  }
}
