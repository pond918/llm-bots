import AsyncLock from 'async-lock'
import GradioBot from '../huggingface/GradioBot'
import { LLMServerType } from '../base-bot'
import { ChatDto } from '../chat.dto'

/** https://chat.lmsys.org/ */
// based on https://github.com/sunner/ChatALL
export default class LMSYSBot extends GradioBot {
  // static _brandId = 'lmsys' // Brand id of the bot, should be unique. Used in i18n.
  // static _className = 'LMSYSBot' // Class name of the bot
  // static _logoFilename = 'lmsys-logo.png' // Place it in assets/bots/
  // static _settingsComponent = 'LMSYSBotSettings' // Vue component filename for settings

  _lock = new AsyncLock() // FIXME Send requests in queue to save LMSYS

  constructor(name: string, readonly _model: string) {
    super(name, 'https://chat.lmsys.org/', [9, 10], 'html')
  }

  /** needn't token */
  _initSession(): Promise<boolean> {
    return this.reloadSession()
  }

  _getServerType() {
    return LLMServerType.threads // TODO test if is tree
  }

  makeData(fn_index: number, prompt: ChatDto) {
    let r = null
    if (fn_index === this._fnIndexes[0]) {
      r = [null, this._model, prompt.text]
    } else if (fn_index === this._fnIndexes[1]) {
      r = [null, 0.7, 1, 512] // TODO [null, temperature, Top P, max output tokens]
    }
    return r
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  parseData(fn_index: number, data: any): string {
    let r = ''
    if (fn_index === this._fnIndexes[1]) {
      r = data[1].at(-1)[1]
    }
    return r || ''
  }

  parseError(errorMsg: string) {
    if (errorMsg.includes('REFRESH THIS PAGE')) {
      errorMsg = errorMsg.replace(
        'REFRESH THIS PAGE',
        `<a href="${this._loginUrl}" target="innerWindow">REFRESH THIS PAGE</a>`,
      )
    }
    return errorMsg
  }
}
