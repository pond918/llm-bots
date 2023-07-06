/* eslint-disable no-console */
import { ChatDto, LLMBots } from '../src'

describe('builtin LLMBots: vicuna-13b (e2e)', () => {
  it(`lmsys-bots`, async () => {
    const bots = new LLMBots()

    const claudeBot = bots.instance('vicuna-13b')
    expect(claudeBot).not.toBeNull()

    const ready = await claudeBot?.reloadSession()
    expect(ready).toBeTruthy()

    const r = await claudeBot?.sendPrompt(new ChatDto('Who is Gauss. reply 3 words most'))
    console.log(r)
    expect(r?.text).not.toBeNull()

    // contextual conversation
    const req = new ChatDto("What's his wife's full name. reply 5 words most")
    const resp = await claudeBot?.sendPrompt(req, msg => console.log(msg))
    console.log(resp)
    expect(resp?.text).not.toBeNull()
    expect(resp?.options.lastMsgId).toEqual(req.id)
    expect(resp?.options._conversationKey).not.toBeNull()
  })
})
