import { Page } from '@prisma/client'
import { CheerioAPI } from 'cheerio'
import makeDir from 'make-dir'
import path from 'path'
import sanitize from 'sanitize-filename'
import sleep from 'sleep-promise'
import { WalkerConfig } from '../../loaders/site-config-schema'
import FileUtil from '../../utils/file-util'
import HttpUtil from '../../utils/http-util'
import Logger from '../../utils/logger'
import WalkAgent from '../walk-agent'
import BaseProcessor from './base-processor'

export default class ImageProcessor extends BaseProcessor {
  /**
   * 画像保存処理を実行する.
   *
   * @param {WalkAgent} agent Walk エージェント
   * @param {Page} page ページ
   * @param {CheerioAPI} $ ページの DOM 要素
   * @param {WalkerConfig} walker 使用している walker 設定
   * @returns void
   */
  public async exec(agent: WalkAgent, page: Page, $: CheerioAPI, walker: WalkerConfig): Promise<void> {
    // 対象の URL を抽出
    const links = await agent.extractLinks($, walker)

    // 存在するPage URL を取り除く
    const newLinks = await agent.filteredNonExistUrls(links)

    // 参照する親要素を推定
    const virtualParent = await agent.getVirtualParentPage(page, walker)

    // ディレクトリ作成
    const root = sanitize(agent.site.title ?? 'undefined')
    const group = sanitize(virtualParent?.title ?? 'undefined')
    const dirPath = await makeDir(path.join('./tmp/downloads', root, group))

    // 全要素について確認する
    for await (const link of newLinks) {
      // // 保存する
      await this.download(agent, page, dirPath, link)
      await sleep(1500) // TODO: 仮
    }
  }

  /**
   * 画像をダウンロードする.
   *
   * @param {WalkAgent} agent Walk エージェント
   * @param {Page} page ページ
   * @param {string} dirPath 保存するディレクトリ
   * @param {string} link 画像URL
   * @returns {String} 保存したフルパス
   */
  protected async download(agent: WalkAgent, page: Page, dirPath: string, link: string): Promise<string> {
    // 画像を保存する
    const buffer = await HttpUtil.blob(link)

    // ファイル名生成（pathnameのとこ）
    const u = new URL(link)
    const pathname = u.pathname
    const lastname = pathname.slice(Math.max(0, pathname.lastIndexOf('/') + 1))
    const filename = sanitize(lastname ?? 'filename')

    // ファイル保存
    const fullPath = path.join(dirPath, filename)
    await FileUtil.writeBuffer(fullPath, buffer)
    Logger.debug('> <%s> write: %s', agent.site.key, fullPath)

    // ページとして記録する
    await agent.createPage(link, filename, page)

    return fullPath
  }
}
