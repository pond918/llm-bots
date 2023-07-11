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

  protected static readonly _conversation_key_ = '_Conversation_key_'

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
   * @param config the API token, or user login callback.
   * @returns true is succeed
   */
  async initSession(config: Record<string, any> | (() => Record<string, any>)): Promise<boolean> {
    const ready = await this._initSession(config)
    if (ready) this.setAvailable(true)
    else this.setAvailable(undefined)
    return ready
  }

  /**
   * create llm server session from API token, or user login callback, or reuse a session from pool
   * @param userToken the API token, or user login callback.
   * @returns true is succeed
   */
  protected abstract _initSession(config: Record<string, any> | (() => Record<string, any>)): Promise<boolean>

  /**
   * reload session context, including conversation.
   */
  async reloadSession(): Promise<boolean> {
    const ready = await this._reloadSession()
    this.setAvailable(ready)
    return ready
  }

  /**
   * reload session context, including conversation.
   */
  protected abstract _reloadSession(): Promise<boolean>

  /**
   * @returns `true` if the bot is ready to chat, `false` if session need reload, `undefined` if session not initialized
   */
  async isAvailable(): Promise<boolean | undefined> {
    return await this._userStorage.get<boolean>('_isAvailable')
  }

  /**
   * @param v `true` if the bot is ready to chat, `false` if session need reload, `undefined` if session not initialized
   */
  async setAvailable(v: boolean | undefined) {
    await this._userStorage.set('_isAvailable', v)
  }

  async sendPrompt(msg: ChatDto): Promise<ChatDto> {
    if (!msg.text) return new ChatDto('')

    if (!(await this.isAvailable())) {
      const msg = new ChatDto('bot.notAvailable', 404)
      msg.options?.stream && msg.options.stream(msg)
      return msg
    }

    // always store req into storage history
    // `lastMsgId` and `_conversationKey` are updated
    const branched = await this._chatHistory.append(msg)

    if (this._getServerType() == 'stateless') {
      msg = await this._chatHistory.getWholeThread(msg) // send the whole history
    } else {
      // llm server has the history.
      if (branched) {
        if (this._getServerType() == 'threads') {
          // if thread cut. a new server thread has to be created
          throw new Error('TODO: create a new server thread for new branch.')
          msg.options._conversationKey = ''
        } // else server side support
      }

      // create new conversation on llm server
      msg.options._conversationKey || (msg.options._conversationKey = await this._getConversation(true))
      await this._setConversation(msg.options._conversationKey)
    }

    return this._sendPrompt(msg).then(async resp => {
      // store response msg into history
      resp.options.lastMsgId = msg.id
      resp.options.type = 'ai'
      msg.options.stateless || (await this._chatHistory.append(resp))
      return resp
    })
  }

  /**
   * @param msg prompt msg, or whole chat thread.
   * @param streamCallback
   */
  abstract _sendPrompt(msg: ChatDto): Promise<ChatDto>

  /**
   * @returns the LLM server type:
   * - `stateless`: server does not keep chat history
   * - `threads`: server keeps multi-threads of chat history
   * - `trees`: server keeps tree structured history
   */
  abstract _getServerType(): LLMServerType

  /** start a new conversation thread */
  abstract createConversation(): Promise<string>

  /**
   * stateful llm server has server side conversations
   * @param create true: force create; false: never create; otherwise: create if there is no key
   * @returns
   */
  async _getConversation(create?: boolean): Promise<string> {
    let key = create ? '' : await this.__storage.get<string>(LLMBot._conversation_key_)
    if (create || (!key && create !== false)) {
      key = await this.createConversation()
      this._setConversation(key)
    }
    return key
  }
  /** stateful llm server has server side conversations */
  async _setConversation(key: string) {
    this.__storage.set(LLMBot._conversation_key_, key)
  }
}

export enum LLMServerType {
  /** server does not keep chat history, like gpt-api */
  stateless = 'stateless',
  /** server keeps multi-threads of chat history */
  threads = 'threads',
  /** server keeps tree structured history */
  trees = 'trees',
}
