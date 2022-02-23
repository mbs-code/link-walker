import { Page, Site } from '@prisma/client'
import { WalkerConfig } from '../loaders/site-config-schema'
import { QueueWithPage } from '../repositories/queue-repository'

export default class DumpUtil {
  public static site(s?: Site | null): string {
    if (s) {
      return `[${s.id}] <${s.key}> ${s.title}`
    }

    return 'null'
  }

  public static page(p?: Page | null): string {
    if (p) {
      return `[${p.id}] ${p.url} (${p.title})`
    }

    return 'null'
  }

  public static queue(qp?: QueueWithPage | null, separator = '--'): string {
    if (qp) {
      return `[${qp.id}] ${separator} ${DumpUtil.page(qp.page)})`
    }

    return 'null'
  }

  ///

  public static walker(w?: WalkerConfig): string {
    if (w) {
      return `<${w.key}> ${w.processor}`
    }

    return 'null'
  }
}
