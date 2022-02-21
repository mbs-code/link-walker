import { Page } from '@prisma/client'
import { CheerioAPI } from 'cheerio'
import { WalkerConfig } from '../../loaders/site-config-schema'
import WalkAgent from '../walk-agent'

export default abstract class BaseProcessor {
  public abstract exec(agent: WalkAgent, page: Page, $: CheerioAPI, walker: WalkerConfig): void
}
