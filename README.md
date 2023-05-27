# LLM bots

[![Actions Status](https://github.com/pond918/llm-bots/workflows/ci/badge.svg)](https://github.com/pond918/llm-bots/actions)
[![Known Vulnerabilities](https://snyk.io/test/github/pond918/llm-bots/badge.svg?targetFile=package.json)](https://snyk.io/test/github/pond918/llm-bots?targetFile=package.json)
[![npm](https://img.shields.io/npm/v/@pond918/llm-bots.svg)](https://www.npmjs.com/package/@pond918/llm-bots)
[![license](https://img.shields.io/npm/l/l@pond918/lm-bots.svg)](https://www.npmjs.com/package/@pond918/llm-bots)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](https://makeapullrequest.com)
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fpond918%2Fllm-bots.svg?type=shield)](https://app.fossa.com/projects/git%2Bgithub.com%2Fpond918%2Fllm-bots?ref=badge_shield)

## What is it?

A npm package of many large language model (LLMs) client chat bots, e.g. ChatGPT, Bing Chat, bard, Alpaca, Vincuna, Claude, ChatGLM, MOSS, iFlytek Spark, ERNIE and more. You may register your own bots easily.

The package enables bots to support unlimited conversations. each conversation has tree-structured chat history ( each chat message has a `lastMsgId`).

Another use case is to isolate different users for the same bot on the same nodejs server. All user related data: session/conversation/chat history, etc. is stored in the specified BotStorage on different namespaces.

## Getting Started

### Install the library

```sh
npm install --save @pond918/llm-bots
```

### using the bots

```typescript
import { ChatDto, LLMBots } from '@pond918/llm-bots'

const bots = LLMBots.factory()
const claudeBot = bots.instance('vicuna-13b')
const ready = await claudeBot?.reloadSession()
if (ready) {
  const resp = await claudeBot?.sendPrompt(new ChatDto('hi there. 1 word most'))
  console.log(resp)

  // stream response
  claudeBot?.sendPrompt(new ChatDto('who is Gauss. 5 words most'), (msg) => console.log(msg))
}
```

### register a new bot

```typescript
import { LLMBots } from '@pond918/llm-bots'

// you may apply a custom user data storage
const bots = LLMBots.factory(storage);

// new bot will replace old bot with same name.
bots.register(new MyLLMBot());

const models = LLMBots.list();
console.log(Object.keys(models));
```

## bot state management

There are 3 state for a llm bot instance:

- llm config state: e.g. llm url. Stored as bot class properties.
- server session state: API tokens/login sessions. Stored in the session pool, may be shared among users.
- user data state: conversation/chat history. Stored in the provided storage, usually user isolated.

## Credits

- bots implementation are based on [ChatAll](https://github.com/sunner/ChatALL). Respect!
- [NodeJS Starter ToolKit](https://github.com/vitorsalgado/create-nodejs-ts)


## License
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fpond918%2Fllm-bots.svg?type=large)](https://app.fossa.com/projects/git%2Bgithub.com%2Fpond918%2Fllm-bots?ref=badge_large)