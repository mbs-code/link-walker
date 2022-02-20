import { Page, Walker } from '@prisma/client'
import { CheerioAPI } from 'cheerio'
import makeDir from 'make-dir'
import path from 'path'
import sanitize from 'sanitize-filename'
import sleep from 'sleep-promise'
import FileUtil from '../../utils/file-util'
import HttpUtil from '../../utils/http-util'
import Logger from '../../utils/logger'
import WalkAgent from '../walk-agent'

export default class ImageProcessor {
  /**
   * 画像保存処理を実行する.
   *
   * @param {CheerioAPI} $ DOM要素
   * @param {Parent} parent 親ページ
   * @param {Walker} walker 使用している walker
   * @param {WalkAgent} agent Walkエージェント
   * @returns void
   */
  public async exec($: CheerioAPI, parent: Page, walker: Walker, agent: WalkAgent): Promise<void> {
    // 対象の URL を抽出
    const links = await agent.extractLinks($, walker)

    // 存在するPage URL を取り除く
    const newLinks = await agent.filteredNonExistUrls(links)

    // 参照する親要素を推定
    const virtualParent = await agent.getVirtualParentPage(parent, walker)

    // ディレクトリ作成
    const root = sanitize(agent.site.title ?? 'undefined')
    const group = sanitize(virtualParent?.title ?? 'undefined')
    const dirPath = await makeDir(path.join('./tmp/downloads', root, group))

    // 全要素について確認する
    for await (const link of newLinks) {
      // // 保存する
      await this.download(dirPath, link, parent, agent)
      await sleep(1500) // TODO: 仮
    }
  }

  /**
   * 画像をダウンロードする.
   *
   * @param {string} dirPath 保存するディレクトリ
   * @param {string} link 画像URL
   * @param {Page} parent 親ページ要素
   * @param {WalkAgent} agent Walkエージェント
   * @returns {String} 保存したフルパス
   */
  protected async download(dirPath: string, link: string, parent: Page, agent: WalkAgent): Promise<string> {
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
    await agent.createPage(link, filename, parent)

    return fullPath
  }
}
