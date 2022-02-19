import { Page, PrismaClient, Site } from '@prisma/client'

const prisma = new PrismaClient()

export default class PageRepository {
  public static async findOne(site: Site, url: string): Promise<Page | null> {
    // Page が存在するか確認する
    const page = await prisma.page.findFirst({
      where: {
        siteId: site.id,
        url: url,
      },
    })

    return page
  }

  public static async upsert(site: Site, url: string, title?: string): Promise<Page> {
    const data = {
      siteId: site.id,
      url: url,
      title: title,
    }

    // IDを探してから upsert する
    const exists = await PageRepository.findOne(site, url)
    const page = await prisma.page.upsert({
      where: { id: exists?.id },
      create: data,
      update: data,
    })

    return page
  }
}
