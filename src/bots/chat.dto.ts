import { nanoid } from 'nanoid'

export class ChatDto {
  /** local msg id */
  id?: string
  /** status code. empty means ok; positive means still processing; negative means no more processing */
  statusCode?: number
  message?: string

  /**
   * @param statusCode status code. empty means ok; negative means still processing; negative means no more processing
   * @param options
   */
  constructor(
    public text?: string,
    statusCode = 0,
    public readonly options: {
      /** msg type, undefined means `human` */
      type?: 'ai' | 'system' | undefined
      /** parent msg id. if '', means to start a new conversation; if undefined, append to current conversation. */
      lastMsgId?: string
      /** conversation key from llm server */
      _conversationKey?: string
      /** TODO approximately max words of new response */
      maxResponse?: number
      /** if true, this msg & it's response will not be stored into history */
      stateless?: boolean
      /** history of this msg */
      __history?: ChatDto[]
    } & Record<string, unknown> = {},
  ) {
    statusCode ? (this.statusCode = statusCode) : (this.id = nanoid())
  }
}
