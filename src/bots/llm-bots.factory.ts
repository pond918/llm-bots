import { BotStorage } from '../storage/bot-storage.interface'
import { MemStorage } from '../storage/mem-storage'
import { LLMBot } from './base-bot'
import AlpacaBot from './lmsys/AlpacaBot'
import ChatGLMBot from './lmsys/ChatGLMBot'
import ClaudeBot from './lmsys/ClaudeBot'
import VicunaBot from './lmsys/VicunaBot'
import AzureOpenAIAPIBot from './microsoft/AzureOpenAIAPIBot'

export class LLMBots {
  protected readonly $STORAGE: BotStorage
  protected readonly $REGISTRY: Record<string, LLMBot> = {}
  protected readonly $SERVER_MODE: boolean

  /**
   * create a new bots factory.
   * @param storage user data storage
   * @param serverMode: in server mode, session tokens may be shared among users.
   * @returns the factory
   */
  constructor(storage?: BotStorage, serverMode?: boolean) {
    this.$STORAGE = storage || (storage = new MemStorage())
    this.$SERVER_MODE = !!serverMode

    // init builtin bots
    this.register(new AlpacaBot())
    this.register(new ChatGLMBot())
    this.register(new ClaudeBot())
    this.register(new VicunaBot())
    this.register(new AzureOpenAIAPIBot())

    return
  }

  /**
   * @param bot: bot instance
   * @returns old bot
   */
  register = (bot: LLMBot) => {
    bot._userStorage = this.$STORAGE
    bot.serverMode = !!this.$SERVER_MODE

    const old = this.$REGISTRY[bot.name]
    this.$REGISTRY[bot.name] = bot
    return old
  }

  instance = (name: string): LLMBot | undefined => this.$REGISTRY[name]

  list = () => this.$REGISTRY
}
