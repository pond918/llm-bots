import { ChatOpenAI } from 'langchain/chat_models/openai'
import { AIChatMessage, HumanChatMessage, SystemChatMessage } from 'langchain/schema'
import { LLMBot, LLMServerType } from './base-bot'
import { ChatDto } from './chat.dto'

export default abstract class LangChainBot extends LLMBot {
  protected _chatModel!: ChatOpenAI

  constructor(protected readonly _brandId = 'langChainBot', outputFormat = 'markdown') {
    super(_brandId, outputFormat)
  }

  async _sendPrompt(msg: ChatDto, streamCallback?: (msg: ChatDto) => void): Promise<ChatDto> {
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
          streamCallback && streamCallback(new ChatDto(res, token ? -1 : 0))
        },
      },
    ]
    await this._chatModel.call(messages, undefined, callbacks)
    return new ChatDto(res)
  }

  _getServerType(): LLMServerType {
    return LLMServerType.stateless
  }
}
