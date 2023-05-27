import { ChatDto } from '../bots/chat.dto'
import { BotStorage } from './bot-storage.interface'

/** tree structured chat history. each chat message has a property: 'lastMsgId' */
export class ChatHistory {
  protected static readonly _storage_key = '__Chat_history_'
  constructor(private readonly _storage: BotStorage) {
    _storage.set(ChatHistory._storage_key, [])
  }

  /**
   * append msg to history. if msg.options.lastMsgId is empty, a new thread is created.
   * @param msg
   * @returns true if the msg is appended on a new branch. msg with null parent returns false.
   */
  // async append(msg: ChatDto & { prompt: string }) {
  async append(msg: ChatDto) {
    if (msg.options.compound) throw new Error('chat.history.append.compound.not.allowed')

    let branched = false

    const allMsgs = await this._storage.get<ChatDto[]>(ChatHistory._storage_key)
    const pid = msg.options.lastMsgId
    if (pid) {
      const parent = this._findLast(allMsgs, m => m.id == pid)
      if (!parent) throw Error('chat.history.notfound.lastMsgId: ' + pid)
      branched = !parent.options.leaf
      parent.options.leaf = 0
    }
    msg.options.leaf = 1
    allMsgs.push(msg)

    return branched
  }

  /**
   * @returns ChatDto & { options: { compound: 1 } }
   */
  async getWholeThread(msg: ChatDto): Promise<ChatDto> {
    if (!msg.options?.lastMsgId) return msg

    let mid: unknown = msg.id
    const ret: string[] = [],
      allMsgs = await this._storage.get<ChatDto[]>(ChatHistory._storage_key)
    for (let index = allMsgs.length; index > 0; index--) {
      const a = allMsgs[index - 1]
      if (a.id == mid) {
        ret.push(...a.prompt)
        if (!(mid = a.options.lastMsgId)) break
      }
    }
    return new ChatDto(ret.reverse(), msg.done, { ...msg.options, compound: 1 })
  }

  protected _findLast<T>(array: T[], fn: (a: T) => unknown) {
    for (let index = array.length; index > 0; index--) {
      const a = array[index - 1]
      if (fn(a)) return a
    }
    return
  }
}
