import { Page } from '@prisma/client'
import { CheerioAPI } from 'cheerio'
import { ProcessorType, SiteConfig, WalkerConfig } from '../loaders/site-config-schema'
import WalkerStat from '../stats/walker-stat'
import DumpUtil from '../utils/dump-util'
import Logger from '../utils/logger'
import BaseProcessor from './processors/base-processor'
import ExtractProcessor from './processors/extract-processor'
import ImageProcessor from './processors/image-processor'
import WalkAgent from './walk-agent'

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
   * @returns {Promise<WalkResult>} 処理結果
   */
  public async exec(agent: WalkAgent, page: Page, $: CheerioAPI): Promise<WalkerStat> {
    const stat = new WalkerStat()

    // 一致する walker に対して処理をする
    for await (const walker of this.walkers) {
      if (walker.pattern.test(page.url)) {
        Logger.debug('<%s> ▶ Walker: %s', this.config.key, DumpUtil.walker(walker.config))

        // プロセッサーを実行
        const proStat = await walker.processor.exec(agent, page, $, walker.config)
        Logger.debug('<%s> Success: %s', agent.site.key, proStat.dump())

        stat[walker.config.processor]++
        stat.mergePs(proStat)
      }
    }

    return stat
  }
}
