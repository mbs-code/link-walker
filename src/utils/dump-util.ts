import { Page } from '@prisma/client'
import { SiteWithRelations } from '../repositories/site-repository'

export default class DumpUtil {
  public static site(s: SiteWithRelations): string {
    return `[${s.id}]<${s.key}> ${s.title} (walkers: ${s.walkers.length})`
  }

  public static page(s: Page): string {
    return `[${s.id}] ${s.url} (title: ${s.title})`
  }
}
