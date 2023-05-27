import { BotStorage } from './bot-storage.interface'

export class MemStorage implements BotStorage {
  private readonly _store = new Map<string, unknown>()

  async set(prop: string, v: unknown) {
    this._store.set(prop, v)
  }

  async get<T>(prop: string): Promise<T> {
    return this._store.get(prop) as T
  }
}
