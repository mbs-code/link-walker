import { Command } from '@oclif/core'
import SiteRepository from '../repositories/site-repository'

export default class List extends Command {
  static description = 'Show site table.'

  static examples = ['<%= config.bin %> <%= command.id %>']

  public async run(): Promise<void> {
    // DBから読み出し
    const sites = await SiteRepository.findAll()

    // TODO: CliUx が使えない
    console.table(sites)
  }
}
