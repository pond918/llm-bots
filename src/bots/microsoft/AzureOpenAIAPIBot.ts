import { ChatOpenAI } from 'langchain/chat_models/openai'
import LangChainBot from '../LangChainBot'

export default class AzureOpenAIAPIBot extends LangChainBot {
  constructor() {
    super('azureOpenAIApi')
  }

  async _initSession(config: Record<string, any> | (() => Record<string, any>)) {
    const conf: Record<string, any> = typeof config == 'function' ? (config = config()) : config
    if (!conf?.azureApiKey) return false

    this._usage = !conf.no_usage_report // if stream = true, token usage not available
    this._chatModel = new ChatOpenAI({
      modelName: conf.modelName,
      azureOpenAIApiKey: conf.azureApiKey,
      azureOpenAIApiInstanceName: conf.azureApiInstanceName,
      azureOpenAIApiDeploymentName: conf.azureOpenAIApiDeploymentName,
      azureOpenAIApiVersion: conf.azureOpenAIApiVersion,
      temperature: conf.temperature,
      streaming: false,
    })
    // curl -X POST -H 'Content-type: application/json' -H 'User-Agent: OpenAI/NodeJS/3.3.0' -H 'api-key: c30fe7f14b464d52b515f77148643d60' -H 'Authorization: Bearer undefined' --data '{"model":"gpt-3.5-turbo","temperature":0.7,"top_p":1,"frequency_penalty":0,"presence_penalty":0,"n":1,"stream":false,"messages":[{"role":"user","content":"!"}]}' https://openai-kanjian.openai.azure.com/openai/deployments/gpt-35-turbo/chat/completi ns\?api-version=2023-05-15

    return !!this._chatModel
  }

  async _reloadSession() {
    return !!this._chatModel
  }

  createConversation(): Promise<string> {
    throw new Error('Method not implemented.')
  }
}
