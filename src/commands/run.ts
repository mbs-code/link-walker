import { Command, Flags } from '@oclif/core'
import SiteRepository from '../repositories/site-repository'
import HttpUtil from '../utils/http-util'
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

    Logger.info('🔄 Run walk site...')

    // DBからサイト情報を取ってくる
    const site = await SiteRepository.findOrFail(code)
    Logger.info('📝 [%s] %s (%s)', site.id, site.key, site.title)

    // HTTP GET
    const $ = await HttpUtil.fetch(site.url)

    console.log($('title').text()) // TODO: 仮
  }
}
