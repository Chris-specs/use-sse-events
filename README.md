# use-sse-events

A lightweight, type-safe, and production-ready React hook for Server-Sent Events (SSE).

## Features

- ⚡️ **Zero Dependencies & Ultra-lightweight** (~1.5kB)
- 🌓 **SSR & Next.js Friendly** (Safe for server-side evaluation)
- 🔄 **Auto-Reconnection** (Resilient connection lifecycles)
- 🎯 **Custom Events Support** (Simple and declarative API)
- 🛡️ **Type Safety** (Built with TypeScript 6 and precise `MessageEvent` types)

## Documentation

Read the full documentation at **[https://use-sse.christiansan.com](https://use-sse.christiansan.com)**

## Install

```shell
pnpm add use-sse-events
```

```shell
npm install use-sse-events
```

## Usage

```tsx
'use client'

import { useSSE } from 'use-sse-events'

function App() {
    const { isConnected } = useSSE({
        url: 'https://server.com/api/sse',
        onMessage: (e) => console.log('New message:', e.data),
        customEvents: {
            'update-stock': (e) => console.log('Stock updated:', e.data)
        }
    })

    return <p>Status: {isConnected ? 'Connected' : 'Disconnected'}</p>
}
```

## License

[MIT](./LICENSE)

Made with ❤️ by **[Christian Sanchez](https://christiansan.com)**
