import { Command, Flags } from '@oclif/core'
import SiteConfigLoader from '../loaders/site-config-loader'
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
    const manager = await SiteConfigLoader.load(args.file, {
      peek: flags.peek,
    })

    // キューのリセット処理
    if (flags.clear) {
      Logger.info('🔄 Reset queue & Clear page.')
      await manager.clearPage()
    } else if (flags.reset) {
      Logger.info('🔄 Reset queue.')
      await manager.resetQueue()
    }

    // 実行する
    Logger.info('🔄 Run walking site...')
    for (let i = 0; i < flags.step; i++) {
      // eslint-disable-next-line no-await-in-loop
      await manager.step()
    }

    // TODO: 仮
    // Logger.info('✅ Walked! %s', DumpUtil.site(site))
  }
}
