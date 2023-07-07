import { nanoid } from 'nanoid'
import { ChatDto } from '../bots/chat.dto'
import { BotStorage } from './bot-storage.interface'

/** tree structured chat history. each chat message has a property: 'lastMsgId' */
export class ChatHistory {
  /** all msgs is stored as a linked array: storage<id, [preId, msg]>, with last_id at end */
  protected static readonly _last_msg_id = '__last_Chat_msg_id_'
  constructor(private readonly _storage: BotStorage) {}

  /**
   * append msg to history. `msg.statusCode` must be empty.
   * `msg.options.stateless` msg will not be added into history
   * error if `msg.options.__history` not empty
   *
   * @param msg if `lastMsgId` not empty, append to it; if lastMsgId === '', a new thread created; else, allMsgs[-1] as parent.
   * @sideefect `lastMsgId` and `_conversationKey` in `msg.options` is updated, if available
   * @returns true if the msg is appended on a new branch. msg with no parent returns false.
   */
  // async append(msg: ChatDto & { prompt: string }) {
  async append(msg: ChatDto) {
    if (msg.options.__history?.length) throw new Error('chat.history.append.compound.not.allowed')
    if (msg.statusCode) throw new Error('chat.history.append.undone.not.allowed')
    msg.id || (msg.id = nanoid())

    let branched = false

    const pid = msg.options.lastMsgId
    if (pid) {
      const item = await this._findLast<ChatDto>(m => m.id == pid)
      if (!item) throw Error('chat.history.notfound.lastMsgId: ' + pid)
      const [preId, parent] = item

      branched = !parent.options.leaf
      // branched history, may use different conversation key
      msg.options._conversationKey = parent.options._conversationKey

      if (!msg.options.stateless && parent.options.leaf) {
        delete parent.options.leaf
        await this._storage.set(msg.id as string, [preId, parent])
      }
    } else if (pid !== '') {
      // append to current conversation
      const lastId = await this._storage.get<string>(ChatHistory._last_msg_id)
      if (lastId) {
        const [, parent] = await this._storage.get<[string, ChatDto]>(lastId)
        msg.options.lastMsgId = parent.id
        msg.options._conversationKey = parent.options._conversationKey
      }
    } // else start a new conversation

    msg.options.leaf = 1
    // stateless msg will not be added into history
    if (!msg.options.stateless) {
      const preId = await this._storage.get<string>(ChatHistory._last_msg_id)
      await this._storage.set(ChatHistory._last_msg_id, msg.id)
      await this._storage.set(msg.id as string, [preId, msg])
    }

    return branched
  }

  /**
   *
   * @returns ChatDto & { options: { __history: [] } }
   */
  async getWholeThread(msg: ChatDto): Promise<ChatDto> {
    if (!msg.options?.lastMsgId) return msg
    msg.options.__history = []

    let mid: unknown = msg.options.lastMsgId,
      _conversationKey: string | undefined
    for (let msgId = await this._storage.get<string>(ChatHistory._last_msg_id); msgId; ) {
      const [preId, m] = await this._storage.get<[string, ChatDto]>(msgId)
      if (msgId == mid) {
        msg.options.__history.unshift(m)
        // uses the newest conversation key
        _conversationKey || (_conversationKey = m.options._conversationKey)
        if (!(mid = m.options.lastMsgId)) break
      }
      msgId = preId
    }
    _conversationKey && (msg.options._conversationKey = _conversationKey)
    return msg
  }

  protected async _findLast<T>(fn: (a: T) => unknown): Promise<[string, T] | undefined> {
    // find from end to start
    for (let msgId = await this._storage.get<string>(ChatHistory._last_msg_id); msgId; ) {
      const [preId, a] = await this._storage.get<[string, T]>(msgId)
      if (fn(a)) return [preId, a]
      msgId = preId
    }
    return
  }
}
