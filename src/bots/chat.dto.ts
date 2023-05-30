import { nanoid } from 'nanoid'

export class ChatDto {
  /** local msg id */
  readonly id?: string
  /** status code. empty means ok; positive means still processing; negative means no more processing */
  readonly code?: number

  /**
   * @param code status code. empty means ok; positive means still processing; negative means no more processing
   * @param options
   */
  constructor(
    public prompt: string | string[],
    code = 0,
    public readonly options: {
      /** msg type: true: response, false: request */
      resp?: boolean
      /** parent msg id. if '', means to start a new conversation; if undefined, append to current conversation. */
      lastMsgId?: string
      /** conversation key from llm server */
      _conversationKey?: string
      /** TODO approximately max words of new response */
      maxResponse?: number
      /** if true, this msg & it's response will not be stored into history */
      stateless?: boolean
    } & Record<string, unknown> = {},
  ) {
    code ? (this.code = code) : (this.id = nanoid())
  }
}
