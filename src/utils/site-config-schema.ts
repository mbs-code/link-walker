import { Site, Walker } from '@prisma/client'
import Joi from 'joi'

export type SiteConfig = {
  site: Site
  walkers: Walker[]
}

export const Schema = Joi.object({
  key: Joi.string().required(),
  title: Joi.string().required(),
  url: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .required(),

  walkers: Joi.array()
    .items({
      urlPattern: Joi.string().required(),
      processor: Joi.string().valid('extract', 'image').required(),
      queryPattern: Joi.string(),
      options: Joi.object(),
    })
    .min(1)
    .required(),
})
