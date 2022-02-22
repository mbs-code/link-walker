import { Page } from '@prisma/client'
import { CheerioAPI } from 'cheerio'
import { ProcessorType, SiteConfig, WalkerConfig } from '../loaders/site-config-schema'
import Logger from '../utils/logger'
import BaseProcessor from './processors/base-processor'
import ExtractProcessor from './processors/extract-processor'
import ImageProcessor from './processors/image-processor'
import WalkAgent from './walk-agent'

export type WalkResult = Record<ProcessorType | 'walker', number>

export default class walkSwitcher {
  // プロセッサーの実体
  protected processors: Record<ProcessorType, BaseProcessor> = {
    extract: new ExtractProcessor(),
    image: new ImageProcessor(),
  }

  // 処理スイッチャー
  protected walkers: {
    pattern: RegExp
    processor: BaseProcessor
    config: WalkerConfig
  }[]

  protected config: SiteConfig

  constructor(config: SiteConfig) {
    this.config = config

    // スイッチャーの作成
    const walkers = config.walkers.map((walker) => {
      return {
        pattern: new RegExp(walker.urlPattern),
        processor: this.processors[walker.processor],
        config: walker,
      }
    })

    this.walkers = walkers
  }

  /**
   * プロセッサーを選択して実行する.
   *
   * config の上から順に該当要素すべてを実行する.
   * @param {WalkAgent} agent Walk エージェント
   * @param {Page} page ページ
   * @param {CheerioAPI} $ ページの DOM 要素
   * @returns {Promise<WalkResult>} 処理結果統計
   */
  public async exec(agent: WalkAgent, page: Page, $: CheerioAPI): Promise<WalkResult> {
    const result: WalkResult = {
      walker: 0,
      extract: 0,
      image: 0,
    }

    // 一致する walker に対して処理をする
    for await (const walker of this.walkers) {
      if (walker.pattern.test(page.url)) {
        Logger.debug('🔍 walker: <%s> %s', this.config.title, walker.config.key)

        // プロセッサーを実行
        await walker.processor.exec(agent, page, $, walker.config)
        result.walker++
        result[walker.config.processor]++
      }
    }

    return result
  }
}
