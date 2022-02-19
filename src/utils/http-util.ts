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
    Logger.debug('url: "%s"', url)

    // HTTP GET
    const response = await got(url, {
      headers: {
        'user-agent': 'Mozilla/5.0', // TODO: .env に入れる
      },
    })
    const size = prettyBytes(response.rawBody.byteLength)
    Logger.debug('size: %s', size)

    // DOM解析
    const $ = cheerio.load(response.body)

    return $
  }
}
