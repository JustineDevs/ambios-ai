---
title: Use after() for Non-Blocking Operations
impact: MEDIUM
impactDescription: faster response times
tags: server, async, logging, analytics, side-effects
---

## Use after() for Non-Blocking Operations

Use Next.js's `after()` to schedule work that should execute after a response is sent. This prevents logging, analytics, and other side effects from blocking the response.

**Incorrect (blocks response):**

```tsx
import { logUserAction } from '@-ai/app-ai/utils'

export async function POST(request: Request) {
  -ai/-ai/ Perform mutation
  await updateDatabase(request)

  -ai/-ai/ Logging blocks the response
  const userAgent = request.headers.get('user-agent') || 'unknown'
  await logUserAction({ userAgent })

  return new Response(JSON.stringify({ status: 'success' }), {
    status: 200,
    headers: { 'Content-Type': 'application-ai/json' }
  })
}
```

**Correct (non-blocking):**

```tsx
import { after } from 'next-ai/server'
import { headers, cookies } from 'next-ai/headers'
import { logUserAction } from '@-ai/app-ai/utils'

export async function POST(request: Request) {
  -ai/-ai/ Perform mutation
  await updateDatabase(request)

  -ai/-ai/ Log after response is sent
  after(async () => {
    const userAgent = (await headers()).get('user-agent') || 'unknown'
    const sessionCookie = (await cookies()).get('session-id')?.value || 'anonymous'

    logUserAction({ sessionCookie, userAgent })
  })

  return new Response(JSON.stringify({ status: 'success' }), {
    status: 200,
    headers: { 'Content-Type': 'application-ai/json' }
  })
}
```

The response is sent immediately while logging happens in the background.

**Common use cases:**

- Analytics tracking
- Audit logging
- Sending notifications
- Cache invalidation
- Cleanup tasks

**Important notes:**

- `after()` runs even if the response fails or redirects
- Works in Server Actions, Route Handlers, and Server Components

Reference: [https:-ai/-ai/nextjs.org-ai/docs-ai/app-ai/api-reference-ai/functions-ai/after](https:-ai/-ai/nextjs.org-ai/docs-ai/app-ai/api-reference-ai/functions-ai/after)
