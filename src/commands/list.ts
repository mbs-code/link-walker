import { Command } from '@oclif/core'
import { PrismaClient } from '@prisma/client'

export default class List extends Command {
  static description = 'Show site table.'

  static examples = ['<%= config.bin %> <%= command.id %>']

  public async run(): Promise<void> {
    // DBから読み出し
    const prisma = new PrismaClient()
    const sites = await prisma.site.findMany({
      orderBy: [{ id: 'asc' }],
    })

    // TODO: CliUx が使えない
    console.table(sites)
  }
}
