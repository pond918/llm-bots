import { nanoid } from 'nanoid'

export class ChatDto {
  /** local msg id */
  readonly id?: string
  readonly done?: boolean

  constructor(
    public readonly prompt: string | string[],
    done = true,
    public readonly options: {
      /** msg type: true: response, false: request */
      resp?: boolean
      /** parent msg id. if '', means to start a new conversation; if undefined, append to current conversation. */
      lastMsgId?: string
      /** conversation key from llm server */
      _conversationKey?: string
      /** approximate max length of new response */
      maxNewWords?: number
    } & Record<string, unknown> = {},
  ) {
    done && ((this.id = nanoid()), (this.done = true))
  }
}
