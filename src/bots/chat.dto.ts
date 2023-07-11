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
      /** if true, this msg & it's response will not be stored into history */
      stateless?: boolean
      /** history of this msg */
      __history?: ChatDto[]

      //// llm props
      /** stream callback */
      stream?: (msg: ChatDto) => void
      modelName?: string
      temperature?: number
      /** Number of completions to generate for each prompt */
      n?: number
      /** Total probability mass of tokens to consider at each step */
      topP?: number
      /** respond token usage for current QA */
      tokens?: number
      /** Maximum number of tokens to generate in the completion. -1 returns as many tokens as possible given the prompt and the model's maximum context size. */
      maxTokens?: number
      /** quota number of tokens, will be updated in LLM response. */
      quotaTokens?: number
    } & Record<string, unknown> = {},
  ) {
    statusCode ? (this.statusCode = statusCode) : (this.id = nanoid())
  }
}
