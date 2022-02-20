import { Page, Walker } from '@prisma/client'
import { CheerioAPI } from 'cheerio'
import WalkAgent from '../walk-agent'

export default class ExtractProcessor {
  /**
   * URL抽出処理を実行する.
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

    // キューに追加
    await agent.addQueues(links, parent)
  }
}
