import { Command } from '@oclif/core'
import { PrismaClient } from '@prisma/client'
import ConfigUtil from '../utils/config-util'
import Logger from '../utils/logger'

export default class Add extends Command {
  static description = 'Add site configure'

  static examples = [
    { command: '<%= config.bin %> <%= command.id %>', description: 'Generate template.yaml' },
    { command: '<%= config.bin %> <%= command.id %> xyz.yaml', description: 'Load config.yaml' },
  ]

  static args = [{ name: 'file', required: false }]

  public async run(): Promise<void> {
    const { args } = await this.parse(Add)
    const file = args.file

    // ファイルがあるならDBへ書き込み
    if (file) {
      Logger.info('🔄 Load config yaml...')

      // ファイル読み込み
      const fullPath = ConfigUtil.fullpath(file)
      Logger.debug('path: "%s"', fullPath)
      const siteItem = await ConfigUtil.load(fullPath)
      Logger.debug('yaml: %s', JSON.stringify(siteItem))

      // DBへ書き込み
      const prisma = new PrismaClient()
      const site = await prisma.site.upsert({
        where: {
          key: siteItem.key ?? undefined,
        },
        create: siteItem,
        update: siteItem,
      })
      Logger.debug('record: %s', JSON.stringify(site))

      Logger.info('✅ Loaded config yaml. id="%s" key="%s"', site.id, site.key)
    }
  }
}
