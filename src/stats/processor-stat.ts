export default class ProcessorStat {
  /** 処理対象のリンク数 */
  public link = 0
  /** スキップした数 */
  public skip = 0
  /** ページを更新した数 */
  public page = 0
  /** キューに挿入した数 */
  public enque = 0
  /** ダウンロードした数 */
  public download = 0

  /**
   * 統計をマージする.
   *
   * @param {ProcessorStat} stat 統計情報
   * @returns void
   */
  public merge(stat: ProcessorStat): void {
    this.link += stat.link
    this.skip += stat.skip
    this.page += stat.page
    this.enque += stat.enque
    this.download += stat.download
  }

  public dump(): string {
    const params = {
      link: this.link,
      enque: this.enque,
      page: this.page,
      dl: this.download,
      skip: this.skip,
    }

    const msg = Object.entries(params)
      .map(([key, value]) => key + ': ' + value)
      .join(', ')
    return '{ ' + msg + ' }'
  }
}
