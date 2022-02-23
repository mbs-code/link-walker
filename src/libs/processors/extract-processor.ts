import { Page } from '@prisma/client'
import { CheerioAPI } from 'cheerio'
import { WalkerConfig } from '../../loaders/site-config-schema'
import ProcessorStat from '../../stats/processor-stat'
import Logger from '../../utils/logger'
import WalkAgent from '../walk-agent'
import BaseProcessor from './base-processor'

export default class ExtractProcessor extends BaseProcessor {
  /**
   * URL抽出処理を実行する.
   *
   * @param {WalkAgent} agent Walk エージェント
   * @param {Page} parent ページ
   * @param {CheerioAPI} $ ページの DOM 要素
   * @param {WalkerConfig} walker 使用している walker 設定
   * @returns {Promise<ProcessorStat>} 処理結果
   */
  public async exec(agent: WalkAgent, parent: Page, $: CheerioAPI, walker: WalkerConfig): Promise<ProcessorStat> {
    const stat = new ProcessorStat()

    // 対象の URL を抽出
    const links = await agent.extractLinks($, walker)
    Logger.debug('<%s> Extract: %d links', agent.site.key, links.length)

    // 全要素を確認して、キューに追加
    for await (const link of links) {
      // DB からページ要素を取り出す nullable
      const dbPage = await agent.findPage(link)

      // 未処理なら更新してキューに追加する
      const isUnprocessed = agent.isUnprocessedPage(dbPage)
      if (isUnprocessed) {
        const page = await agent.upsertPage(walker, link, undefined, parent)
        stat.page++

        await agent.addQueue(walker, page)
        stat.enque++
      } else {
        Logger.trace('<%s> skip: %s', agent.site.key, link)
        stat.skip++
      }

      stat.link++
    }

    return stat
  }
}
