import { ChatOpenAI } from 'langchain/chat_models/openai'
import LangChainBot from '../LangChainBot'

export default class AzureOpenAIAPIBot extends LangChainBot {
  constructor() {
    super('azureOpenAIApi')
  }

  async _initSession(config: Record<string, any> | (() => Record<string, any>)) {
    const conf: Record<string, any> = typeof config == 'function' ? (config = config()) : config
    if (!conf?.azureApiKey) return false

    this._chatModel = new ChatOpenAI({
      azureOpenAIApiKey: conf.azureApiKey,
      azureOpenAIApiInstanceName: conf.azureApiInstanceName,
      azureOpenAIApiDeploymentName: conf.azureOpenAIApiDeploymentName,
      azureOpenAIApiVersion: conf.azureOpenAIApiVersion,
      temperature: conf.temperature,
      streaming: true,
    })

    return !!this._chatModel
  }

  async _reloadSession() {
    return !!this._chatModel
  }

  createConversation(): Promise<string> {
    throw new Error('Method not implemented.')
  }
}
