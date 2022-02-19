import { SiteWithRelations } from '../repositories/site-repository'

export default class DumpUtil {
  public static site(s: SiteWithRelations): string {
    return `[${s.id}]<${s.key}> ${s.title} (walkers: ${s.walkers.length})`
  }
}
