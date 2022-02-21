import got from 'got'
import cheerio, { CheerioAPI } from 'cheerio'
import Logger from './logger'
import prettyBytes from 'pretty-bytes'

export default class HttpUtil {
  /**
   * HTTP GET を行いDOM Objectを取得する.
   *
   * @param {string | URL} url URL
   * @returns {Promise<CheerioAPI>} DOM Object
   */
  public static async fetch(url: string | URL): Promise<CheerioAPI> {
    Logger.trace('web:url:fetch "%s"', url)

    // HTTP GET
    const response = await got(url, {
      headers: {
        'user-agent': 'Mozilla/5.0', // TODO: .env に入れる
      },
    })
    const size = prettyBytes(response.rawBody.byteLength)
    Logger.trace('> web:size: %s', size)

    // DOM解析
    const $ = cheerio.load(response.body)

    return $
  }

  /**
   * HTTP GET を行いBlob Bufferを取得する.
   *
   * @param {string | URL} url URL
   * @returns {Promise<Buffer>} Blob Buffer
   */
  public static async blob(url: string | URL): Promise<Buffer> {
    Logger.trace('> web:url:blob "%s"', url)

    // HTTP GET
    const response = await got(url, {
      responseType: 'buffer',
      headers: {
        'user-agent': 'Mozilla/5.0', // TODO: .env に入れる
      },
    })
    const size = prettyBytes(response.rawBody.byteLength)
    Logger.trace('> web:size: %s', size)

    return response.body
  }

  ///

  /**
   * URL からファイル名を取り出す.
   *
   * @param {string} link URL
   * @returns {string} ファイル名
   */
  public static parseLastname(link: string): string {
    const u = new URL(link)
    const pathname = u.pathname
    const lastname = pathname.slice(Math.max(0, pathname.lastIndexOf('/') + 1))
    return lastname
  }
}
