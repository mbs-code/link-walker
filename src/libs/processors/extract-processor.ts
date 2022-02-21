import { Page } from '@prisma/client'
import { CheerioAPI } from 'cheerio'
import sleep from 'sleep-promise'
import { WalkerConfig } from '../../loaders/site-config-schema'
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
   * @returns void
   */
  public async exec(agent: WalkAgent, parent: Page, $: CheerioAPI, walker: WalkerConfig): Promise<void> {
    // 対象の URL を抽出
    const links = await agent.extractLinks($, walker)

    // 全要素を確認して、キューに追加
    for await (const link of links) {
      // DB からページ要素を取り出す nullable
      const dbPage = await agent.findPage(link)

      // 未処理なら更新してキューに追加する
      if (agent.isUnprocessedPage(dbPage)) {
        const page = await agent.upsertPage(walker, link, undefined, parent)
        await agent.addQueue(walker, page)
      }
    }

    await sleep(1500) // TODO: 仮
  }
}
