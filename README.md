![heyalice.app](https://cdn.prod.website-files.com/65fede07c8ebce778713cee7/65fede07c8ebce778713cf74_alice_logo.svg)

# heyalice.app — template of a custom back-end in node.js

> This repository is currently experimental and may undergo significant changes. The plan is to maintain full compatibility with the OpenAI interface.

## Installation

1. Clone this repository
2. Install dependencies with bun `bun install`
3. Copy `.env.example` as `.env` and update your OpenAI API key
4. Start server using `bun start` or `bun server.ts`

## Connection with "Alice" app

1. Open Settings by either: pressing Command + , or clicking on Search Bar and then Settings, or by clicking on cog icon (fullscreen mode)
2. Open Advanced tab
3. Add endpoint, by default it's http://localhost:3005/api/chat
4. (optional but recommended) Add authorization header
5. Add model you want to use on your back-end. It can't be in conflict with gpt-4o or any other model. It's a good practice to use prefix like for example — local:gpt-4o
6. From the list of the models (right beneath text input on the chat) select local:gpt-4o model or any model you set in 5th step.

## Known issues

1. When server is down and you send the message, you need to reload the app (right mouse button -> reload) or restart it.
