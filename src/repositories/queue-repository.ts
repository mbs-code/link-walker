import { Page, PrismaClient, Queue, Site } from '@prisma/client'
import DumpUtil from '../utils/dump-util'
import Logger from '../utils/logger'

const prisma = new PrismaClient()

export type QueueWithPage = Queue & {
  page: Page
}

export type PageParams = {
  url: string
  title?: string
  parent?: Page
}

export default class QueueRepository {
  /**
   * キューの先頭からページを取り出す.
   *
   * @param {Site} site サイト情報
   * @returns {Promise<QueueWithPage | null>} 先頭のキュー要素
   */
  public static async peek(site: Site): Promise<QueueWithPage | null> {
    // Queue の先頭を取り出す
    const queue = await prisma.queue.findFirst({
      where: { siteId: site.id },
      orderBy: [{ priority: 'desc' }, { id: 'asc' }],
      include: { page: true },
    })

    return queue ?? null
  }

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
   * キューのデータを削除する..
   *
   * @param {Site} site サイト情報
   * @param {Queue} queue キュー
   * @returns void
   */
  public static async remove(site: Site, queue: Queue): Promise<void> {
    // キューの削除
    await prisma.queue.delete({
      where: { id: queue.id },
    })

    Logger.trace('> <%s> db:delete:queue [%d] -> %s', site.key, queue.id, queue.pageId)
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
