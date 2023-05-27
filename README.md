# LLM bots

[![Actions Status](https://github.com/pond918/llm-bots/workflows/ci/badge.svg)](https://github.com/pond918/llm-bots/actions)
[![Known Vulnerabilities](https://snyk.io/test/github/pond918/llm-bots/badge.svg?targetFile=package.json)](https://snyk.io/test/github/pond918/llm-bots?targetFile=package.json)
[![npm](https://img.shields.io/npm/v/@pond918/llm-bots.svg)](https://www.npmjs.com/package/@pond918/llm-bots)
[![license](https://img.shields.io/npm/l/l@pond918/lm-bots.svg)](https://www.npmjs.com/package/@pond918/llm-bots)
.

## What is it?

A nodejs package of many large language model (LLMs) client chat bots, e.g. ChatGPT, Bing Chat, bard, Alpaca, Vincuna, Claude, ChatGLM, MOSS, iFlytek Spark, ERNIE and more. You can also define a new bot with the same interface easily.

The package enables bots to support unlimited conversations. each conversation has tree-structured chat history ( each chat message has a `lastMsgId`).

Another use case is to isolate different users for the same bot on the same server. All user related data: session/conversation/chat history, etc. is stored in the specified BotStorage on different namespaces.

## Getting Started

### Install the library

```sh
npm install --save @pond918/llm-bots
```

### using the bots

```typescript
import { LLMBots } from '@pond918/llm-bots'

const bots = LLMBots.factory();
const bot = bots.instance('model_name'); // singleton for each model
await bot.initSession(userToken); // api token or login callback function
if(await bot.reloadSession()) // check session availability.
  bot.sendPrompt({ prompt: 'the prompt', options: { lastMsgId: 'xxx', maxNewWords: 10, stream: false } } as ChatDto);
```

### register a new bot

```typescript
import { LLMBots } from '@pond918/llm-bots'

const bots = LLMBots.factory(storage);
// new bot will replace old bot with same model name.
bots.register('my_model_name', new MyLLMBot());
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
