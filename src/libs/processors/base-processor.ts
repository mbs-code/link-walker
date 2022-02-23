import { Page } from '@prisma/client'
import { CheerioAPI } from 'cheerio'
import { WalkerConfig } from '../../loaders/site-config-schema'
import ProcessorStat from '../../stats/processor-stat'
import WalkAgent from '../walk-agent'

// NOTE:
// processor を増やすときは、以下の箇所の整合性を合わせる。
// - schema.prisma
// - xxxx-processor.ts
// - site-repository.ts @ updateStats()
// - walker-stats.ts

export default abstract class BaseProcessor {
  public abstract exec(agent: WalkAgent, parent: Page, $: CheerioAPI, walker: WalkerConfig): Promise<ProcessorStat>
}
