import { Page } from '@prisma/client'
import { CheerioAPI } from 'cheerio'
import makeDir from 'make-dir'
import path from 'path'
import sanitize from 'sanitize-filename'
import sleep from 'sleep-promise'
import { WalkerConfig } from '../../loaders/site-config-schema'
import ProcessorStat from '../../stats/processor-stat'
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
   * @param {Page} parent ページ
   * @param {CheerioAPI} $ ページの DOM 要素
   * @param {WalkerConfig} walker 使用している walker 設定
   * @returns {Promise<ProcessorStat>} 統計
   */
  public async exec(agent: WalkAgent, parent: Page, $: CheerioAPI, walker: WalkerConfig): Promise<ProcessorStat> {
    const stat = new ProcessorStat()

    // 対象の URL を抽出
    const links = await agent.extractLinks($, walker)
    Logger.debug('<%s> Extract: %d links', agent.site.key, links.length)

    // 参照する親要素を推定
    const virtualParent = await agent.getVirtualParentPage(parent, walker)

    // ディレクトリ作成
    const root = sanitize(agent.site.title ?? 'undefined')
    const group = sanitize(virtualParent?.title ?? 'undefined')
    const dirPath = await makeDir(path.join('./tmp/downloads', root, group))
    Logger.debug('<%s> Direcory: %s', agent.site.key, dirPath)

    // 全要素を確認して、ダウンロードする
    for await (const link of links) {
      // DB からページ要素を取り出す nullable
      const dbPage = await agent.findPage(link)

      // 未処理なら保存して更新する
      const isUnprocessed = agent.isUnprocessedPage(dbPage)
      if (isUnprocessed) {
        // ダウンロード処理
        const { buffer, title } = await HttpUtil.blob(link)
        const fullPath = path.join(dirPath, title ?? 'undefined')
        await FileUtil.writeBuffer(fullPath, buffer)
        stat.download++

        // ページ作成
        await agent.upsertPage(walker, link, title, parent)
        stat.page++
      } else {
        Logger.trace('<%s> skip: %s', agent.site.key, link)
        stat.skip++
      }

      stat.link++
      await sleep(1000) // TODO: 仮
    }

    return stat
  }
}
