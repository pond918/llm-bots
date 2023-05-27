import { BotStorage } from '../storage/bot-storage.interface'
import { MemStorage } from '../storage/mem-storage'
import { LLMBot } from './base-bot'
import AlpacaBot from './lmsys/AlpacaBot'
import ChatGLMBot from './lmsys/ChatGLMBot'
import ClaudeBot from './lmsys/ClaudeBot'
import VicunaBot from './lmsys/VicunaBot'

export const LLMBots = {
  /**
   * create a new bots factory.
   * @param storage user data storage
   * @param serverMode: in server mode, session tokens may be shared among users.
   * @returns the factory
   */
  factory: (storage?: BotStorage, serverMode = false) => {
    const $STORAGE = storage || (storage = new MemStorage())
    const $REGISTRY: Record<string, LLMBot> = {}
    const $SERVER_MODE = serverMode

    const registerBot = (bot: LLMBot) => {
      bot._userStorage = $STORAGE
      bot.serverMode = $SERVER_MODE

      const old = $REGISTRY[bot.name]
      $REGISTRY[bot.name] = bot
      return old
    }

    // init builtin bots
    registerBot(new AlpacaBot())
    registerBot(new ChatGLMBot())
    registerBot(new ClaudeBot())
    registerBot(new VicunaBot())

    return {
      /**
       * @param bot: bot instance
       * @returns old bot
       */
      register: registerBot,

      instance: (name: string): LLMBot | undefined => $REGISTRY[name],

      list: () => $REGISTRY,
    }
  },
}
