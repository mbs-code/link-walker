import { Command, Flags } from '@oclif/core'
import SiteConfigLoader from '../apps/site-config-loader'
import Logger from '../utils/logger'

export default class Run extends Command {
  static description = 'Walk site link'

  static examples = ['<%= config.bin %> <%= command.id %>']

  static flags = {
    time: Flags.integer({ char: 't', description: 'Number of times.', default: 1 }),
    peek: Flags.boolean({ char: 'p', description: 'Peek when deque.' }),
    clear: Flags.boolean({ char: 'c', description: 'Reset queue & Clear pages.' }),
    reset: Flags.boolean({ char: 'r', description: 'Reset queue.' }),
  }

  static args = [{ name: 'file', required: true, description: 'site config.yaml' }]

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(Run)

    // 実処理インスタンスを作成
    const walk = await SiteConfigLoader.load(args.file, {
      peek: flags.peek,
    })

    // キューのリセット処理
    if (flags.clear) {
      Logger.info('🔄 Reset queue & Clear page.')
      await walk.clearPage()
    } else if (flags.reset) {
      Logger.info('🔄 Reset queue.')
      await walk.resetQueue()
    }

    // 実行する
    Logger.info('🔄 Run walking site...')
    for (let i = 0; i < flags.time; i++) {
      // eslint-disable-next-line no-await-in-loop
      await walk.step()
    }

    // TODO: 仮
    // Logger.info('✅ Walked! %s', DumpUtil.site(site))
  }
}
