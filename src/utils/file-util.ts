import { promises } from 'fs'
import prettyBytes from 'pretty-bytes'
import Logger from './logger'

export default class FileUtil {
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
    Logger.trace('file:write %s (%s)', filePath, size)

    return filePath
  }
}
