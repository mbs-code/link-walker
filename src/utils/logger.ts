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
      layout: { type: 'pattern', pattern: '%d %5p - %m' },
    },
  },
  categories: {
    default: { appenders: ['console', 'file'], level: 'debug' },
  },
})

const Logger = getLogger()
Logger.level = 'debug'

export default Logger
