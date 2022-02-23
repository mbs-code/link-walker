import { Command, Flags } from '@oclif/core'
import SiteConfigLoader from '../loaders/site-config-loader'
import WalkerStat from '../stats/walker-stat'
import DumpUtil from '../utils/dump-util'
import Logger from '../utils/logger'
import Show from './show'

export default class Run extends Command {
  static description = `Walking site links.
  You can extract links and download objects step by step.
  Please set the processing in the config.yaml file.`

  static examples = ['<%= config.bin %> <%= command.id %>']

  static flags = {
    step: Flags.integer({ char: 's', description: 'Number of steps.', default: 1 }),
    peek: Flags.boolean({ char: 'p', description: 'Peek when deque.' }),
    clear: Flags.boolean({ char: 'c', description: 'Reset queue & Clear pages.' }),
    reset: Flags.boolean({ char: 'r', description: 'Reset queue.' }),

    status: Flags.boolean({ description: "[Alias] Show site status. (Don't run)" }),
    ...Show.flags,
  }

  static args = [{ name: 'file', required: true, description: 'site config.yaml' }]

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(Run)

    // もし status が有効なら Show の Alias を貼る
    if (flags.status) {
      const fgs = []
      if (flags.all) fgs.push('--all')
      if (flags.tree) fgs.push('--tree')
      if (flags.config) fgs.push('--config')
      await Show.run([args.file, ...fgs])
      return
    }

    // 実処理インスタンスを作成
    const { manager, site } = await SiteConfigLoader.load(args.file, {
      peek: flags.peek,
    })
    Logger.info('site: %s', DumpUtil.site(site))
    Logger.info('_url: %s', site.url)

    const stat = new WalkerStat()

    // キューのリセット処理
    if (flags.clear) {
      Logger.log('EVENT', '■ RESET queue & CLEAR history')
      await manager.clearPage()
      stat.reset++
    } else if (flags.reset) {
      Logger.log('EVENT', '■ RESET queue')
      await manager.resetQueue()
      stat.reset++
    }

    // 実行する
    Logger.log('EVENT', '■ Run walk links... step=%d', flags.step)
    for (let i = 0; i < flags.step; i++) {
      // eslint-disable-next-line no-await-in-loop
      const walkStat = await manager.step(i + 1, flags.step)
      stat.merge(walkStat)
    }

    // 最終状況の出力
    Logger.log('EVENT', '■ Completed. %s', stat.dump())
    await Show.run([args.file])
    // TODO: show の関数化
  }
}
