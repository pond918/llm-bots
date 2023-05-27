/** storage to store all bot session/context/history data */
export interface BotStorage {
  set(prop: string, v: unknown): Promise<void>
  get<T>(prop: string): Promise<T>
}
