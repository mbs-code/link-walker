import { Command, Flags } from '@oclif/core'
import { Site, Queue, Page } from '@prisma/client'
import { cli } from 'cli-ux'
import SiteConfigLoader from '../loaders/site-config-loader'
import PageRepository from '../repositories/page-repository'
import QueueRepository from '../repositories/queue-repository'
import SiteRepository from '../repositories/site-repository'
import DumpUtil from '../utils/dump-util'
import List from './list'

export default class Show extends Command {
  static description = 'Show site status.'

  static examples = ['<%= config.bin %> <%= command.id %>']

  static flags = {
    all: Flags.boolean({ description: 'Show all status.' }),
    tree: Flags.boolean({ description: 'Show page tree.' }),
    config: Flags.boolean({ description: 'Show config file.' }),
  }

  static args = [{ name: 'file', required: false }]

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(Show)

    // もし file が指定されなかったら List の alias を貼る
    if (!args.file) {
      await List.run()
      return
    }

    // サイト設定の読み込み
    const config = await SiteConfigLoader.loadfile(args.file)

    // データダンプ
    const site = await SiteRepository.findOne(config.key)
    const pages = site ? await PageRepository.findAll(site) : []
    const queues = site ? await QueueRepository.findAll(site) : []

    // サイト情報
    this.log('▶ site infomation')
    this.showSiteInfo(site, pages, queues)

    // キュー情報
    this.log()
    this.log('▶ queue (%d)', queues.length)
    this.showQueueList(pages, queues)

    // ページ要素
    if (flags.all || flags.tree) {
      this.log()
      this.log('▶ page tree (%d)', pages.length)
      this.showPageTree(pages)
    }

    // サイトコンフィグ
    if (flags.all || flags.config) {
      this.log()
      this.log('▶ config yaml')
      this.log(JSON.stringify(config, null, 2))
    }
  }

  protected showSiteInfo(site: Site | null, pages: Page[], queues: Queue[]): void {
    const items = [
      {
        id: site?.id,
        key: site?.key,
        title: site?.title,
        url: site?.url,
        pages: pages.length,
        queues: queues.length,
        step: site?.cntStep ?? 0,
        reset: site?.cntReset ?? 0,
        walker: (site?.cntExtract ?? 0) + (site?.cntImage ?? 0),
        extract: site?.cntExtract ?? 0,
        image: site?.cntImage ?? 0,
        lastRunAt: site?.updatedAt.toLocaleString(),
      },
    ]

    cli.table(items, {
      id: {},
      key: {},
      title: {},
      url: {},
      pages: {},
      queues: {},
      step: {},
      reset: {},
      walker: {},
      extract: {},
      image: {},
      lastRunAt: { header: 'LastRunAt' },
    })
  }

  protected showQueueList(pages: Page[], queues: Queue[]): void {
    const items = queues.map((queue, idx) => {
      // page 要素を検索する
      const page = pages.find((p) => p.id === queue.pageId)
      return {
        key: idx,
        pri: queue.priority,
        page: DumpUtil.page(page),
      }
    })

    cli.table(items, { key: {}, pri: {}, page: {} })
  }

  protected showPageTree(pages: Page[]): void {
    const tree = cli.tree()
    for (const page of pages) {
      const stack = []

      // 親要素を探索して、あったらスタックに追加
      let parent = page
      while (parent) {
        // 親要素の探索
        const exist = pages.find((p) => p.id === parent.parentId)
        if (!exist) break

        stack.unshift(this.pageString(exist))
        parent = exist
      }

      // 先頭から探してインサートする
      let t = tree
      for (const str of stack) {
        t = t.nodes[str]
      }

      t.insert(this.pageString(page))
    }

    tree.display()
  }

  protected pageString(page: Page) {
    let icon = ''
    if (page.processor === 'extract') icon = '♻︎'
    if (page.processor === 'image') icon = '🎨'
    return icon + DumpUtil.page(page)
  }

  ///

  protected kvTable(items: Record<string, unknown>[]): void {
    // TODO: cli-uxpackage is deprecated
    cli.table(
      items,
      {
        key: { minWidth: 7 },
        value: {},
      },
      {
        'no-header': true,
        printLine: this.log.bind(this),
      }
    )
  }
}
