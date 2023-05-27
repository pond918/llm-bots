import { ChatDto, LLMBots } from '../src'

describe('builtin LLMBots: vicuna-13b (e2e)', () => {
  it(`lmsys-bots`, async () => {
    const bots = LLMBots.factory()

    const claudeBot = bots.instance('vicuna-13b')
    expect(claudeBot).not.toBeNull()

    const ready = await claudeBot?.reloadSession()
    expect(ready).toBeTruthy()

    const resp = await claudeBot?.sendPrompt(new ChatDto('hi there. 1 word most'))
    // console.log(resp)
    expect(resp?.prompt).not.toBeNull()
  })
})
