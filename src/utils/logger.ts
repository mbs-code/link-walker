import { configure, getLogger, levels } from 'log4js'

levels.addLevels({
  TRACE: { value: 5000, colour: 'grey' },
  DEBUG: { value: 10_000, colour: 'cyan' },
  INFO: { value: 20_000, colour: 'white' },
  EVENT: { value: 25_000, colour: 'green' },
})

configure({
  appenders: {
    console: {
      type: 'stdout',
      layout: { type: 'pattern', pattern: '%[%d %5p - %m%]' },
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
