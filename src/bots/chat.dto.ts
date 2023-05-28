import { nanoid } from 'nanoid'

export class ChatDto {
  /** local msg id */
  readonly id?: string
  readonly done?: boolean

  constructor(
    public readonly prompt: string | string[],
    done = false,
    public readonly options: {
      /** msg type: true: response, false: request */
      resp?: boolean
      /** local parent msg id */
      lastMsgId?: string
      /** approximate max length of new response */
      maxNewWords?: number
      stream?: boolean
    } & Record<string, unknown> = {},
  ) {
    done && ((this.id = nanoid()), (this.done = true))
  }
}
