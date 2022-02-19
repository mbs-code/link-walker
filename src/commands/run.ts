import { Command, Flags } from '@oclif/core'
import SiteRepository from '../repositories/site-repository'
import HttpUtil from '../utils/http-util'

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
    const { args, flags } = await this.parse(Run)
    const code = args.code

    // DBからサイト情報を取ってくる
    const site = await SiteRepository.findOrFail(code)

    // HTTP GET
    const $ = await HttpUtil.fetch(site.url)
    console.log($("title").text()) // TODO: 仮
  }
}
