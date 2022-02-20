import { Page } from '@prisma/client'
import { SiteWithWalkers } from '../repositories/site-repository'

export default class DumpUtil {
  public static site(s?: SiteWithWalkers | null): string {
    if (s) {
      return `[${s.id}]<${s.key}> ${s.title} (walkers: ${s.walkers.length})`
    }

    return 'null'
  }

  public static page(p?: Page | null): string {
    if (p) {
      return `[${p.id}] ${p.url} (title: ${p.title})`
    }

    return 'null'
  }
}
