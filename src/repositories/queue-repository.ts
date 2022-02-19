import { Page, PrismaClient, Queue, Site } from '@prisma/client'
import DumpUtil from '../utils/dump-util'
import Logger from '../utils/logger'
import PageRepository from './page-repository'

const prisma = new PrismaClient()

export default class QueueRepository {
  public static async deque(site: Site): Promise<Page | null> {
    // Queue の先頭を取り出す
    const queue = await prisma.queue.findFirst({
      where: { siteId: site.id },
      orderBy: [{ id: 'asc' }],
      include: { page: true },
    })

    // Queue は消す
    if (queue) {
      const del = await prisma.queue.delete({
        where: { id: queue.id },
      })
      console.log(del)
    }

    return queue?.page ?? null
  }

  public static async addQueue(url: string, site: Site, parent?: Page): Promise<Page | null> {
    // Page が存在するか確認する
    const exists = await PageRepository.findOne(site, url)
    if (exists) return null

    // page の作成とキューの追加
    const page = await prisma.page.create({
      data: {
        siteId: site.id,
        pageId: parent?.id,
        url: url,
        queues: {
          create: [{ siteId: site.id }],
        },
      },
      include: {
        queues: true,
      },
    })

    return page
  }

  /**
   * ページをキューに追加する.
   *
   * @param {Site} site サイト情報
   * @param {Page} page 追加するページ
   * @returns {Queue} キュー
   */
  public static async addQueueByPage(site: Site, page: Page): Promise<Queue> {
    // page の作成とキューの追加
    const queue = await prisma.queue.create({
      data: {
        siteId: site.id,
        pageId: page.id,
      },
    })

    Logger.trace('> <%s> db:create:queue [%d] <- %s', site.key, queue.id, DumpUtil.page(page))

    return queue
  }

  /**
   * キューを空にする.
   *
   * @param {Site} site サイト情報
   * @returns void
   */
  public static async clearQueue(site: Site): Promise<void> {
    const queues = await prisma.queue.deleteMany({
      where: { siteId: site.id },
    })

    Logger.trace('> <%s> db:delete:queue %s items', site.key, queues.count)
  }
}
