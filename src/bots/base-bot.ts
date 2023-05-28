import { BotStorage } from '../storage/bot-storage.interface'
import { ChatHistory } from '../storage/chat-history'
import { ChatDto } from './chat.dto'

/**
 * - all user related conversation/history data should be stored into the provided storage.
 * - llm server session data is stored in session pool. may be shared among users in server mode.
 */
export abstract class LLMBot {
  /** whether the bot runs locally, or on server shared with many users. */
  serverMode = false

  _chatHistory!: ChatHistory
  private __storage!: BotStorage

  constructor(
    /** bot unique name */
    readonly name: string,
    /** 'html', 'markdown' */
    readonly outputFormat = 'markdown',
  ) {}

  /** store user data. different users isolated */
  public set _userStorage(s: BotStorage) {
    this.__storage = s
    this._chatHistory = new ChatHistory(s)
  }

  public get _userStorage() {
    return this.__storage
  }

  /**
   * create llm server session from API token, or user login callback, or reuse a session from pool
   * @param userToken the API token, or user login callback.
   * @returns true is succeed
   */
  abstract initSession(userToken: object | (() => object)): Promise<boolean>

  /**
   * reload session context, e.g. conversation.
   */
  abstract reloadSession(): Promise<boolean>

  /** true if the bot is ready to chat */
  async isAvailable() {
    return await this._userStorage.get<boolean>('_isAvailable')
  }

  async setAvailable(v: boolean) {
    await this._userStorage.set('_isAvailable', v)
  }

  async sendPrompt(msg: ChatDto, streamCallback?: (msg: ChatDto) => void): Promise<ChatDto> {
    if (!(await this.isAvailable())) {
      const msg = new ChatDto('bot.notAvailable', true)
      streamCallback && streamCallback(msg)
      return msg
    }

    // always store req into storage history
    const branched = await this._chatHistory.append(msg)

    if (this._getServerType() == 'stateless') {
      msg = await this._chatHistory.getWholeThread(msg) // send the whole history
    } else {
      // llm server has the history.
      if (branched) {
        if (this._getServerType() == 'threads') {
          // if thread cut. a new server thread has to be created
          throw new Error('TODO: create a new server thread for new branch.')
        } // else server side support
      }
    }

    return this._sendPrompt(msg, streamCallback).then(async resp => {
      // store response msg into history
      resp.options.lastMsgId = msg.id
      resp.options.resp = true
      await this._chatHistory.append(resp)
      return resp
    })
  }

  /**
   * @param msg prompt msg, or whole chat thread.
   * @param streamCallback
   */
  abstract _sendPrompt(msg: ChatDto, streamCallback?: (msg: ChatDto) => void): Promise<ChatDto>

  /**
   * @returns the LLM server type:
   * - `stateless`: server does not keep chat history
   * - `threads`: server keeps multi-threads of chat history
   * - `tree`: server keeps tree structured history
   */
  abstract _getServerType(): LLMServerType
}

export enum LLMServerType {
  /** server does not keep chat history, like gpt-api */
  stateless = 'stateless',
  /** server keeps multi-threads of chat history */
  threads = 'threads',
  /** server keeps tree structured history */
  tree = 'tree',
}
