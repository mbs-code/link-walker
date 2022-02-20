import { Command } from '@oclif/core'
import { cli } from 'cli-ux'
import SiteConfigLoader from '../apps/site-config-loader'
import { WalkDump } from '../libs/walk-manager'
import DumpUtil from '../utils/dump-util'

export default class Show extends Command {
  static description = 'Show site status.'

  static examples = [
    { command: '<%= config.bin %> <%= command.id %>', description: 'Show all site status.' },
    { command: '<%= config.bin %> <%= command.id %> config.yaml', description: 'Show site status.' },
  ]

  static args = [{ name: 'file', required: false }]

  public async run(): Promise<void> {
    const { args } = await this.parse(Show)

    // 実処理インスタンスを作成
    const manager = await SiteConfigLoader.load(args.file)

    // データダンプ
    const dump = await manager.dump()

    // サイト情報
    this.log('▶ site infomation')
    this.showSiteInfo(dump)

    // キュー情報
    this.log()
    this.log('▶ queue (%d)', dump.queues.length)
    this.showQueueList(dump)

    // ページ要素
    this.log()
    this.log('▶ page tree (%d)', dump.pages.length)
    this.showPageTree(dump)
  }

  protected showSiteInfo({ site, pages, queues }: WalkDump): void {
    const items = [
      { key: 'id', value: site.id },
      { key: 'key', value: site.key },
      { key: 'title', value: site.title },
      { key: 'url', value: site.url },

      { key: 'pages', value: pages.length },
      { key: 'queues', value: queues.length },
    ]

    cli.table(items, { key: {}, value: {} }, { 'no-header': true })
  }

  protected showQueueList({ pages, queues }: WalkDump): void {
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

  protected showPageTree({ pages }: WalkDump): void {
    const tree = cli.tree()
    for (const page of pages) {
      const stack = []

      // 親要素を探索して、あったらスタックに追加
      let parent = page
      while (parent) {
        // 親要素の探索
        const exist = pages.find((p) => p.id === parent.pageId)
        if (!exist) break

        stack.unshift(DumpUtil.page(exist))
        parent = exist
      }

      // 先頭から探してインサートする
      let t = tree
      for (const str of stack) {
        t = t.nodes[str]
      }

      t.insert(DumpUtil.page(page))
    }

    tree.display()
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
