import { Page, PrismaClient, Queue, Site } from '@prisma/client'
import DumpUtil from '../utils/dump-util'
import Logger from '../utils/logger'

const prisma = new PrismaClient()

export type PageWithQueue = Page & {
  queues: Queue[]
}

export type PageParams = {
  url: string
  title?: string
  parent?: Page
}

export default class QueueRepository {
  /**
   * サイトのキューをすべて取得する.
   *
   * @param {Site} site サイト情報
   * @returns {Promise<Queue[]>} DBに存在したキュー配列
   */
  public static async findAll(site: Site): Promise<Queue[]> {
    // 存在するキューをすべて取得する
    const queues = await prisma.queue.findMany({
      where: { siteId: site.id },
      orderBy: [{ priority: 'desc' }, { id: 'asc' }],
    })

    return queues
  }

  ///

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
      orderBy: [{ priority: 'desc' }, { id: 'asc' }],
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
   * 新しいURLをキューに追加する.
   *
   * 最適化のため、DBに追加されているかは確認していません。
   * @param {Site} site サイト情報
   * @param {PageParams} params ページパラメタ
   * @param {number} priority キューの優先度
   * @returns {Promise<PageWithQueue | null>} キュー
   */
  public static async addQueueByNewUrl(
    site: Site,
    params: PageParams,
    priority?: number
  ): Promise<PageWithQueue | null> {
    // page の作成とキューの追加
    const page = await prisma.page.create({
      data: {
        siteId: site.id,
        pageId: params.parent?.id,
        url: params.url,
        title: params.title,
        queues: {
          create: [
            {
              siteId: site.id,
              priority: priority,
            },
          ],
        },
      },
      include: {
        queues: true,
      },
    })

    const queue = page.queues[0]
    Logger.trace('> <%s> db:create:queue:page [%d] <- %s', site.key, queue.id, DumpUtil.page(page))

    return page
  }

  /**
   * ページをキューに追加する.
   *
   * @param {Site} site サイト情報
   * @param {Page} page 追加するページ
   * @param {number} priority キューの優先度
   * @returns {Queue} キュー
   */
  public static async addQueueByPage(site: Site, page: Page, priority?: number): Promise<Queue> {
    // page の作成とキューの追加
    const queue = await prisma.queue.create({
      data: {
        siteId: site.id,
        pageId: page.id,
        priority: priority,
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
