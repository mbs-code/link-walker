import { Command } from '@oclif/core'
import { PrismaClient } from '@prisma/client'
import ConfigUtil from '../utils/config-util'

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
      // ファイル読み込み
      const fullPath = ConfigUtil.fullpath(file)
      const siteItem = await ConfigUtil.load(fullPath)
      this.log(JSON.stringify(siteItem))

      // DBへ書き込み
      const prisma = new PrismaClient()
      const site = await prisma.site.upsert({
        where: {
          key: siteItem.key ?? undefined,
        },
        create: siteItem,
        update: siteItem,
      })
      this.log(JSON.stringify(site))
    }
  }
}
