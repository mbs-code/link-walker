import { configure, getLogger } from 'log4js'

configure({
  appenders: {
    console: {
      type: 'stdout',
      layout: { type: 'pattern', pattern: '%[%d %5p%] - %m' },
    },
    file: {
      type: 'dateFile',
      filename: './logs/app.log',
      pattern: 'yyyyMMdd',
      fileNameSep: '-',
      numBackups: 15,
      alwaysIncludePattern: true,
      keepFileExt: true,
      level: 'debug', // debug までを記録
      layout: { type: 'pattern', pattern: '%d %5p - %m' },
    },
  },
  categories: {
    default: { appenders: ['console', 'file'], level: 'all' },
  },
})

const Logger = getLogger()

export default Logger
