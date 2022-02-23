import got from 'got'
import cheerio, { CheerioAPI } from 'cheerio'
import Logger from './logger'
import prettyBytes from 'pretty-bytes'

export type HttpFetchResult = {
  url: string
  $: CheerioAPI
  title?: string
}

export type HttpBlobResult = {
  url: string
  buffer: Buffer
  title?: string
}

export default class HttpUtil {
  /**
   * HTTP GET を行いDOM Objectを取得する.
   *
   * @param {string | URL} url URL
   * @returns {Promise<HttpFetchResult>} fetch result
   */
  public static async fetch(url: string | URL): Promise<HttpFetchResult> {
    Logger.trace('[web:url:fetch] %s', url)

    // HTTP GET
    const response = await got(url, {
      headers: {
        'user-agent': 'Mozilla/5.0', // TODO: .env に入れる
      },
    })

    // DOM解析、タイトル取得
    const $ = cheerio.load(response.body)
    const title = HttpUtil.getTitle($, response.url)

    const size = prettyBytes(response.rawBody.byteLength)
    Logger.debug('Fetch: "%s" (%s) (%s)', response.url, title, size)

    return { url: response.url, $, title }
  }

  /**
   * HTTP GET を行いBlob Bufferを取得する.
   *
   * @param {string | URL} url URL
   * @returns {Promise<HttpBlobResult>} blob result
   */
  public static async blob(url: string | URL): Promise<HttpBlobResult> {
    Logger.trace('[web:url:blob] %s', url)

    // HTTP GET
    const response = await got(url, {
      responseType: 'buffer',
      headers: {
        'user-agent': 'Mozilla/5.0', // TODO: .env に入れる
      },
    })

    // DOM解析、タイトル取得
    const title = HttpUtil.parseLastname(response.url)

    const size = prettyBytes(response.rawBody.byteLength)
    Logger.debug('Blob: "%s" (%s) (%s)', response.url, title, size)

    return { url: response.url, buffer: response.body, title }
  }

  ///

  /**
   * タイトル文字列を取得する.
   *
   * @param {CheerioAPI} $ dom 要素
   * @param {string} url URL
   * @returns {string} タイトル文字列
   */
  public static getTitle($: CheerioAPI, url: string): string {
    // DOM からタイトルを取得する
    let title = $('title').text()

    // タイトルが無ければ、パスの最終要素とする
    if (!title) title = HttpUtil.parseLastname(url)

    // 改行コード、前後のスペースは消す
    title = title.replace(/\r?\n/g, '').trim()
    return title
  }

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
