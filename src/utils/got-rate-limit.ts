import valvelet from 'valvelet'
import got, { ResponseType } from 'got'

// TODO: .env に入れる
const userAgent = 'Mozilla/5.0'
const interval = 1500 // TODO: 再調整、valvelet内部で再度delay関数を使ってゆらぎを出してもいいかも

export default valvelet(
  (responseType: ResponseType, url: string, parentUrl?: string) => {
    return got(url, {
      responseType: responseType,
      headers: {
        'user-agent': userAgent,
        Referer: parentUrl,
      },
    })
  },
  1,
  interval
)
