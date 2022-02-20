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
      name: Joi.string(),
      urlPattern: Joi.string().required(),
      processor: Joi.string().valid('extract', 'image').required(),
      urlFilter: Joi.string(),
      queryFilter: Joi.string(),
      priority: Joi.number().min(0).max(65_535),
    })
    .unique('name')
    .min(1)
    .required(),
})
