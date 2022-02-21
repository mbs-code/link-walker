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
   * @param {Page} page ページ
   * @param {CheerioAPI} $ ページの DOM 要素
   * @param {WalkerConfig} walker 使用している walker 設定
   * @returns void
   */
  public async exec(agent: WalkAgent, page: Page, $: CheerioAPI, walker: WalkerConfig): Promise<void> {
    // 対象の URL を抽出
    const links = await agent.extractLinks($, walker)

    // キューに追加
    await agent.addQueues(walker, links, page)

    await sleep(1500) // TODO: 仮
  }
}
