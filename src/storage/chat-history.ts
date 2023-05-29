import { ChatDto } from '../bots/chat.dto'
import { BotStorage } from './bot-storage.interface'

/** tree structured chat history. each chat message has a property: 'lastMsgId' */
export class ChatHistory {
  protected static readonly _history_key = '__Chat_history_'
  constructor(private readonly _storage: BotStorage) {
    _storage.set(ChatHistory._history_key, [])
  }

  /**
   * append msg to history. `msg.done` must be true.
   *
   * @param msg if `lastMsgId` not empty, append to it; if lastMsgId === '', a new thread created; else, allMsgs[-1] as parent.
   * @sideefect `lastMsgId` and `_conversationKey` in `msg.options` is updated, if available
   * @returns true if the msg is appended on a new branch. msg with no parent returns false.
   */
  // async append(msg: ChatDto & { prompt: string }) {
  async append(msg: ChatDto) {
    if (msg.options.compound) throw new Error('chat.history.append.compound.not.allowed')
    if (!msg.done) throw new Error('chat.history.append.undone.not.allowed')

    let branched = false

    const allMsgs = await this._storage.get<ChatDto[]>(ChatHistory._history_key)
    const pid = msg.options.lastMsgId
    if (pid) {
      const parent = this._findLast(allMsgs, m => m.id == pid)
      if (!parent) throw Error('chat.history.notfound.lastMsgId: ' + pid)

      branched = !parent.options.leaf
      // branched history, may use different conversation key
      msg.options._conversationKey = parent.options._conversationKey

      msg.options.stateless || delete parent.options.leaf
    } else if (pid !== '') {
      // append to current conversation
      const parent = allMsgs.at(-1)
      if (parent) {
        msg.options.lastMsgId = parent.id
        msg.options._conversationKey = parent.options._conversationKey
      }
    } // else start a new conversation

    msg.options.leaf = 1
    // stateless msg will not be added into history
    msg.options.stateless || allMsgs.push(msg)

    return branched
  }

  /**
   * @returns ChatDto & { options: { compound: 1 } }
   */
  async getWholeThread(msg: ChatDto): Promise<ChatDto> {
    if (!msg.options?.lastMsgId) return msg

    let mid: unknown = msg.id,
      _conversationKey: string | undefined
    const ret: string[] = [],
      allMsgs = await this._storage.get<ChatDto[]>(ChatHistory._history_key)
    for (let index = allMsgs.length; index > 0; index--) {
      const m = allMsgs[index - 1]
      if (m.id == mid) {
        ret.push(...m.prompt)
        // uses the newest conversation key
        _conversationKey || (_conversationKey = m.options._conversationKey)
        if (!(mid = m.options.lastMsgId)) break
      }
    }
    const retMsg = new ChatDto(ret.reverse(), msg.done, { ...msg.options, compound: 1 })
    _conversationKey && (retMsg.options._conversationKey = _conversationKey)
    return retMsg
  }

  protected _findLast<T>(array: T[], fn: (a: T) => unknown) {
    for (let index = array.length; index > 0; index--) {
      const a = array[index - 1]
      if (fn(a)) return a
    }
    return
  }
}
