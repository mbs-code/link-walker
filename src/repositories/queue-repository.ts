import { Page, PrismaClient, Queue, Site } from '@prisma/client'
import DumpUtil from '../utils/dump-util'
import Logger from '../utils/logger'
import PageRepository from './page-repository'

const prisma = new PrismaClient()

export type PageWithQueue = Page & {
  queues: Queue[]
}

export default class QueueRepository {
  /**
   * キューの先頭からページを取り出す.
   *
   * @param {Site} site サイト情報
   * @param {boolean} usePeek ピークを使うか false
   * @returns {Promise<Page | null>} ページ要素
   */
  public static async deque(site: Site, usePeek = false): Promise<Page | null> {
    // Queue の先頭を取り出す
    const queue = await prisma.queue.findFirst({
      where: { siteId: site.id },
      orderBy: [{ id: 'asc' }],
      include: { page: true },
    })

    // ピークモード以外なら、Queue は消す
    if (!usePeek && queue) {
      const remove = await prisma.queue.delete({
        where: { id: queue.id },
      })

      Logger.trace('> <%s> db:delete:queue [%d] <- %s', site.key, remove.id, DumpUtil.page(queue.page))
    }

    return queue?.page ?? null
  }

  /**
   * URLをキューに追加する.
   *
   * @param {string} url URL
   * @param {Site} site サイト情報
   * @param {Page} parent 追加するページ
   * @returns {Promise<PageWithQueue | null>} キュー
   */
  public static async addQueue(url: string, site: Site, parent?: Page): Promise<PageWithQueue | null> {
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

    const queue = page.queues[0]
    Logger.trace('> <%s> db:create:queue [%d] <- %s', site.key, queue.id, DumpUtil.page(page))

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
  public static async clear(site: Site): Promise<void> {
    // キューの全削除
    const queues = await prisma.queue.deleteMany({
      where: { siteId: site.id },
    })

    Logger.trace('> <%s> db:delete:queue %s items', site.key, queues.count)
  }
}
