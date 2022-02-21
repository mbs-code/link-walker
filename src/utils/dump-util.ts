import { Page, Site } from '@prisma/client'

export default class DumpUtil {
  public static site(s?: Site | null): string {
    if (s) {
      return `[${s.id}]<${s.key}> ${s.title}`
    }

    return 'null'
  }

  public static page(p?: Page | null): string {
    if (p) {
      return `[${p.id}] ${p.url} (${p.title})`
    }

    return 'null'
  }
}
