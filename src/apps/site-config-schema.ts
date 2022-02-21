import Joi from 'joi'

const processorTypeArray = ['extract', 'image'] as const
export type ProcessorType = typeof processorTypeArray[number]

///

export type SiteConfig = {
  key: string // 一意のキー
  title: string // ページタイトル
  url: string // ルートURL

  walkers: WalkerConfig[] // walker 設定
}

export type WalkerConfig = {
  key: string // 一意のキー
  urlPattern: string // 実行するURLの正規表現
  processor: ProcessorType // 実行する処理

  queryFilter?: string // 抽出対象の DOM selector (default: "[src],[attr]")
  urlFilter?: string // 抽出するURLの正規表現
  priority?: number // 追加時のキューの優先度、大きいほうが先に処理される (extract) (default: 0)
  addParentGen?: number // 親要素を追加でどれだけ遡るか (<image>) (default: 0)
}

///

export const siteConfigSchema = Joi.object({
  key: Joi.string().required(),
  title: Joi.string().required(),
  url: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .required(),

  walkers: Joi.array()
    .items({
      key: Joi.string().required(),
      urlPattern: Joi.string().required(),
      processor: Joi.string()
        .valid(...processorTypeArray)
        .required(),
      urlFilter: Joi.string(),
      queryFilter: Joi.string(),
      priority: Joi.number().min(0).max(65_535),
      addParentGen: Joi.number().min(0),
    })
    .unique('name')
    .required(),
})
