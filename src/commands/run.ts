import { Command, Flags } from '@oclif/core'
import WalkManager from '../libs/walk-manager'
import SiteRepository from '../repositories/site-repository'
import DumpUtil from '../utils/dump-util'
import Logger from '../utils/logger'

export default class Run extends Command {
  static description = 'Walk site link'

  static examples = ['<%= config.bin %> <%= command.id %>']

  static flags = {
    reset: Flags.boolean({ char: 'r', description: 'Reset queue.' }),
  }

  static args = [{ name: 'code', required: true, description: 'site ID or KEY' }]

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(Run)
    const code = args.code

    // DBからサイト情報を取ってくる
    const site = await SiteRepository.findOrFail(code)
    Logger.info('📝 %s', DumpUtil.site(site))

    // 処理実態を作成
    const walk = new WalkManager(site)

    // キューのリセット処理
    if (flags.reset) {
      Logger.info('🔄 Reset queue.')
      await walk.resetQueue()
    }

    Logger.info('🔄 Run walking site...')
    // await walk.step()
  }
}
