import { Command } from '@oclif/core'
import SiteRepository from '../repositories/site-repository'
import ConfigUtil from '../utils/config-util'
import Logger from '../utils/logger'

export default class Add extends Command {
  static description = 'Add site configure.'

  static examples = ['<%= config.bin %> <%= command.id %> config.yaml']

  static args = [{ name: 'file', required: true, description: 'config.yaml' }]

  public async run(): Promise<void> {
    const { args } = await this.parse(Add)
    const file = args.file

    Logger.info('🔄 Load config yaml...')

    // ファイル読み込み
    const fullPath = ConfigUtil.fullpath(file)
    const siteItem = await ConfigUtil.load(fullPath)

    // DBへ書き込み
    const site = await SiteRepository.upsertByKey(siteItem)

    Logger.info('✅ Loaded config yaml. id="%s" key="%s"', site.id, site.key)
  }
}
