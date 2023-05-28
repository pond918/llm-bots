import { ChatDto, LLMBots } from '../src'

describe('builtin LLMBots: vicuna-13b (e2e)', () => {
  it(`lmsys-bots`, async () => {
    const bots = LLMBots.factory()

    const claudeBot = bots.instance('vicuna-13b')
    expect(claudeBot).not.toBeNull()

    const ready = await claudeBot?.reloadSession()
    expect(ready).toBeTruthy()

    const msg = new ChatDto('Who is Gauss. reply 5 words most')
    // eslint-disable-next-line no-console
    const resp = await claudeBot?.sendPrompt(msg, msg => console.log(msg))
    // eslint-disable-next-line no-console
    console.log(resp)
    expect(resp?.prompt).not.toBeNull()
    expect(resp?.options.lastMsgId).toEqual(msg.id)
    expect(resp?.options._conversationKey).not.toBeNull()
  })
})
