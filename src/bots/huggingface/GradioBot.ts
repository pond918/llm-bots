// based on https://github.com/sunner/ChatALL
import axios from 'axios'
import WebSocketAsPromised from 'websocket-as-promised'
import WebSocket from 'ws'
import { LLMBot } from '../base-bot'
import { ChatDto } from '../chat.dto'

export default abstract class GradioBot extends LLMBot {
  ////// bot configs
  // _brandId = 'gradio' // Brand id of the bot, should be unique. Used in i18n.
  // _displayName = 'GradioBot' // Class name of the bot
  // _logoFilename = 'gradio-logo.svg' // Place it in assets/bots/
  readonly _loginUrl

  constructor(
    name: string,
    /** Any Gradio URL */
    _loginUrl: string,
    /** Indexes of the APIs to call in order. Sniffer it by devtools. */
    readonly _fnIndexes = [0],
    outputFormat = 'markdown',
  ) {
    super(name, outputFormat)
    // Remove trailing slash
    this._loginUrl = _loginUrl.replace(/\/$/, '')
  }

  ////// user state keys
  protected static readonly _session_config = '_session_config'

  async _reloadSession() {
    let available = false
    if (this._loginUrl) {
      try {
        const response = await axios.get(this._loginUrl + '/config')
        if (response.status == 200) {
          const config = response.data
          config.path = response.data.path ?? ''
          config.root = this._loginUrl
          await this._userStorage.set(GradioBot._session_config, config)

          // init a conversation forehand
          await this._getConversation()
          available = true
        }
      } catch (err) {
        await super.setAvailable(false)
        throw err
      }
    }
    await super.setAvailable(available)
    return available
  }

  async _sendPrompt(msg: ChatDto): Promise<ChatDto> {
    let result: ChatDto = new ChatDto('', -1)
    for (const key in this._fnIndexes) {
      const fn_index = this._fnIndexes[key]
      const resp = await this._sendFnIndex(fn_index, msg, msg.options?.stream)
      resp && !resp.statusCode && resp.text && (result = resp)
    }
    this._formalizeResponse(result)
    return result
  }

  async _sendFnIndex(fn_index: number, prompt: ChatDto, streamCallback?: (msg: ChatDto) => void): Promise<ChatDto> {
    const config = await this._userStorage.get<Record<string, string>>(GradioBot._session_config)
    return new Promise(async (resolve, reject) => {
      try {
        const url = new URL(config.root + config.path + '/queue/join')
        url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'

        // browser compatibility
        const wsOptions: Record<string, any> = {
          packMessage: (data: unknown) => {
            return JSON.stringify(data)
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          unpackMessage: (data: any) => {
            return JSON.parse(data.toString())
          },
        }
        if (typeof window === 'undefined') {
          // non-browser
          wsOptions.createWebSocket = (url: string) => new WebSocket(url) as unknown
          wsOptions.extractMessageData = (event: unknown) => event
        }
        const wsp = new WebSocketAsPromised(url.toString(), wsOptions)
        const data = this.makeData(fn_index, prompt)
        const session_hash = await this._getConversation()
        wsp.onUnpackedMessage.addListener(event => {
          if (event.msg === 'send_hash') {
            wsp.sendPacked({ fn_index, session_hash })
          } else if (event.msg === 'send_data') {
            // Requested to send data
            wsp.sendPacked({
              data,
              event_data: null,
              fn_index,
              session_hash,
            })
          } else if (event.msg === 'estimation') {
            if (event.rank > 0) {
              // Waiting in queue
              event.rank_eta = Math.floor(event.rank_eta)
              streamCallback && streamCallback(new ChatDto('gradio.waiting', -1))
            }
          } else if (event.msg === 'process_generating') {
            // Generating data
            if (event.success && event.output.data) {
              streamCallback && streamCallback(new ChatDto(this.parseData(fn_index, event.output.data), -1))
            } else {
              reject(new Error(event.output.error))
            }
          } else if (event.msg === 'process_completed') {
            // Done
            if (event.success && event.output.data) {
              if (typeof event.output.data[2] !== 'string' || event.output.data[2] === '') {
                const prompt = this.parseData(fn_index, event.output.data)
                const resp = new ChatDto(
                  prompt,
                  fn_index == this._fnIndexes.at(-1) ? 0 : -1, // Only the last one is done
                )
                streamCallback && streamCallback(resp)
                resolve(resp)
              } else {
                const errorMsg = this.parseError(event.output.data[2])
                reject(new Error(errorMsg))
              }
            } else {
              reject(new Error(event.output.error))
            }
            wsp.removeAllListeners()
            wsp.close()
          } else if (event.msg === 'queue_full') {
            reject('gradio.queueFull')
          }
        })

        wsp.onClose.addListener(() => {
          // console.log('WebSocket closed:', event)
          wsp.removeAllListeners()
          wsp.close()
          reject(new Error('error.closedByServer'))
        })

        wsp.onError.addListener(event => {
          wsp.removeAllListeners()
          wsp.close()
          reject('error.failedConnectUrl: ' + event.target.url)
        })

        wsp.open().catch(r => {
          reject(r)
        })
      } catch (error) {
        reject(error)
      }
    })
  }

  /** formalize response prompt text, if capable. */
  _formalizeResponse(msg: ChatDto) {
    switch (this.outputFormat) {
      case 'html': // to plain text.
        if (msg.text) msg.text = msg.text.replace(/<[^>]*>/g, ' ')
        break
    }
  }

  abstract parseError(error: string): string
  abstract makeData(fn_index: number, prompt: ChatDto): unknown
  abstract parseData(fn_index: number, data: unknown): string

  async createConversation() {
    return Math.random().toString(36).substring(2)
  }
}
