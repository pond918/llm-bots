import { ChatOpenAI } from 'langchain/chat_models/openai'
import { AIChatMessage, HumanChatMessage, LLMResult, SystemChatMessage } from 'langchain/schema'
import { LLMBot, LLMServerType } from './base-bot'
import { ChatDto } from './chat.dto'

export default abstract class LangChainBot extends LLMBot {
  protected _chatModel!: ChatOpenAI
  /** if stream = true, token usage not available for azure-gpt */
  protected _usage = true

  constructor(protected readonly _brandId = 'langChainBot', outputFormat = 'markdown') {
    super(_brandId, outputFormat)
  }

  async _sendPrompt(msg: ChatDto): Promise<ChatDto> {
    // Convert the messages to the correct format
    const messages =
      msg.options.__history?.map(m => {
        if (m.options.type === 'ai') return new AIChatMessage(m.text as string)
        if (m.options.type === 'system') return new SystemChatMessage(m.text as string)
        return new HumanChatMessage(m.text as string)
      }) || []
    messages.push(new HumanChatMessage(msg.text as string))

    let res = ''
    const callbacks = [
      {
        handleLLMNewToken(token: string) {
          if (token) res += token
          msg.options?.stream && msg.options.stream(new ChatDto(res, -1))
        },
        handleLLMEnd: (val: LLMResult) => {
          res || (res = val.generations[0][0].text) // TODO
          const tokens = val.llmOutput?.tokenUsage?.totalTokens
          if (this._usage) {
            if (!tokens) {
              msg.statusCode = 500
              throw new Error((msg.message = 'LLM token usage should not be empty'))
            }
            msg.options.tokens = tokens
            msg.options.quotaTokens = (msg.options.quotaTokens || 0) - tokens
          }
          msg.options?.stream && msg.options.stream(new ChatDto(res, 0))
        },
      },
    ]

    const { streaming, temperature, n, topP, maxTokens } = this._chatModel

    try {
      this._chatModel.streaming = !this._usage && !!msg.options.stream
      msg.options?.n && (this._chatModel.n = msg.options.n)
      msg.options?.topP && (this._chatModel.topP = msg.options.topP)
      msg.options?.modelName && (this._chatModel.modelName = msg.options.modelName)
      msg.options?.temperature && (this._chatModel.temperature = msg.options.temperature)
      msg.options?.maxTokens &&
        (this._chatModel.maxTokens = msg.options.quotaTokens
          ? Math.min(msg.options.quotaTokens, msg.options.maxTokens)
          : msg.options.maxTokens)

      await this._chatModel.call(messages, undefined, callbacks)
    } finally {
      for (const [p, v] of Object.entries({ streaming, temperature, n, topP, maxTokens }))
        (this._chatModel as any)[p] = v
    }
    const resp = new ChatDto(res, msg.statusCode)
    msg.options.tokens &&
      ([resp.options.tokens, resp.options.quotaTokens] = [msg.options.tokens, msg.options.quotaTokens])
    msg.message && (resp.message = msg.message)
    return resp
  }

  _getServerType(): LLMServerType {
    return LLMServerType.stateless
  }
}
