import { Command, Flags } from '@oclif/core'
import WalkManager from '../libs/walk-manager'
import SiteRepository from '../repositories/site-repository'
import DumpUtil from '../utils/dump-util'
import Logger from '../utils/logger'

export default class Run extends Command {
  static description = 'Walk site link'

  static examples = ['<%= config.bin %> <%= command.id %>']

  static flags = {
    // flag with a value (-n, --name=VALUE)
    name: Flags.string({ char: 'n', description: 'name to print' }),
    // flag with no value (-f, --force)
    force: Flags.boolean({ char: 'f' }),
  }

  static args = [{ name: 'code', required: true, description: 'site ID or KEY' }]

  public async run(): Promise<void> {
    const { args } = await this.parse(Run)
    const code = args.code

    Logger.info('🔄 Run walking site...')

    // DBからサイト情報を取ってくる
    const site = await SiteRepository.findOrFail(code)
    Logger.info('📝 %s', DumpUtil.site(site))

    // 処理実態を作成
    const walk = new WalkManager(site)
    await walk.step()
  }
}
