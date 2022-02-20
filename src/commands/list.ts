import { Command } from '@oclif/core'
import { cli } from 'cli-ux'
import PageRepository from '../repositories/page-repository'
import QueueRepository from '../repositories/queue-repository'
import SiteRepository from '../repositories/site-repository'

export default class List extends Command {
  static description = 'Show site status in DB.'

  static examples = ['<%= config.bin %> <%= command.id %>']

  public async run(): Promise<void> {
    // DBにあるサイト情報を取り出す
    const sites = await SiteRepository.findAll()

    const items = []
    for await (const site of sites) {
      // データダンプ
      const pages = await PageRepository.findAll(site)
      const queues = await QueueRepository.findAll(site)

      items.push({
        id: site.id,
        key: site.key,
        title: site.title,
        url: site.url,
        pages: pages.length,
        queues: queues.length,
        lastRunAt: site.updatedAt.toLocaleString(),
      })
    }

    cli.table(items, {
      id: {},
      key: {},
      title: {},
      url: {},
      pages: {},
      queues: {},
      lastRunAt: { header: 'LastRunAt' },
    })
  }
}
