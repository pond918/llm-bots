import { nanoid } from 'nanoid'

export class ChatDto {
  /** local msg id */
  readonly id: string

  constructor(
    public readonly prompt: string | string[],
    public done = false,
    public readonly options: {
      /** local parent msg id */
      lastMsgId?: string
      /** approximate max length of new response */
      maxNewWords?: number
      stream?: boolean
    } & Record<string, unknown> = {},
  ) {
    this.id = nanoid()
  }
}
