import { Page } from '@prisma/client'
import { CheerioAPI } from 'cheerio'
import makeDir from 'make-dir'
import path from 'path'
import sanitize from 'sanitize-filename'
import sleep from 'sleep-promise'
import { WalkerConfig } from '../../loaders/site-config-schema'
import FileUtil from '../../utils/file-util'
import HttpUtil from '../../utils/http-util'
import WalkAgent from '../walk-agent'
import BaseProcessor from './base-processor'

export default class ImageProcessor extends BaseProcessor {
  /**
   * 画像保存処理を実行する.
   *
   * @param {WalkAgent} agent Walk エージェント
   * @param {Page} parent ページ
   * @param {CheerioAPI} $ ページの DOM 要素
   * @param {WalkerConfig} walker 使用している walker 設定
   * @returns void
   */
  public async exec(agent: WalkAgent, parent: Page, $: CheerioAPI, walker: WalkerConfig): Promise<void> {
    // 対象の URL を抽出
    const links = await agent.extractLinks($, walker)

    // 参照する親要素を推定
    const virtualParent = await agent.getVirtualParentPage(parent, walker)

    // ディレクトリ作成
    const root = sanitize(agent.site.title ?? 'undefined')
    const group = sanitize(virtualParent?.title ?? 'undefined')
    const dirPath = await makeDir(path.join('./tmp/downloads', root, group))

    // 全要素を確認して、ダウンロードする
    for await (const link of links) {
      // DB からページ要素を取り出す nullable
      const dbPage = await agent.findPage(link)

      // 未処理なら保存して更新する
      if (agent.isUnprocessedPage(dbPage)) {
        // ファイル名生成
        const filename = sanitize(HttpUtil.parseLastname(link) ?? 'filename')
        const fullPath = path.join(dirPath, filename)

        // ダウンロード処理
        const buffer = await HttpUtil.blob(link)
        await FileUtil.writeBuffer(fullPath, buffer)

        // ページ作成
        await agent.upsertPage(walker, link, filename, parent)
      }

      // // 保存する
      await sleep(1500) // TODO: 仮
    }
  }
}
