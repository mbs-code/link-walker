import ProcessorStat from './processor-stat'

export default class WalkerStat {
  /** extract processor */
  public extract = 0
  /** image processor */
  public image = 0

  /** リセット回数 (表では使わない) */
  public reset = 0

  /** processor stats */
  public processor: ProcessorStat

  constructor() {
    this.processor = new ProcessorStat()
  }

  /**
   * 統計をマージする.
   *
   * @param {WalkerStat} stat 統計情報
   * @returns void
   */
  public merge(stat: WalkerStat): void {
    this.extract += stat.extract
    this.image += stat.image
    this.processor.merge(stat.processor)
  }

  public mergePs(stat: ProcessorStat): void {
    this.processor.merge(stat)
  }

  public dump(): string {
    const params = {
      worker: this.extract + this.image,
      extract: this.extract,
      image: this.image,
    }

    const msg = Object.entries(params)
      .map(([key, value]) => key + ': ' + value)
      .join(', ')
    return '{ ' + msg + ' } ' + this.processor.dump()
  }
}
