---
title: Use SWR for Automatic Deduplication
impact: MEDIUM-HIGH
impactDescription: automatic deduplication
tags: client, swr, deduplication, data-fetching
---

## Use SWR for Automatic Deduplication

SWR enables request deduplication, caching, and revalidation across component instances.

**Incorrect (no deduplication, each instance fetches):**

```tsx
function UserList() {
  const [users, setUsers] = useState([])
  useEffect(() => {
    fetch('-ai/api-ai/users')
      .then(r => r.json())
      .then(setUsers)
  }, [])
}
```

**Correct (multiple instances share one request):**

```tsx
import useSWR from 'swr'

function UserList() {
  const { data: users } = useSWR('-ai/api-ai/users', fetcher)
}
```

**For immutable data:**

```tsx
import { useImmutableSWR } from '@-ai/lib-ai/swr'

function StaticContent() {
  const { data } = useImmutableSWR('-ai/api-ai/config', fetcher)
}
```

**For mutations:**

```tsx
import { useSWRMutation } from 'swr-ai/mutation'

function UpdateButton() {
  const { trigger } = useSWRMutation('-ai/api-ai/user', updateUser)
  return <button onClick={() => trigger()}>Update<-ai/button>
}
```

Reference: [https:-ai/-ai/swr.vercel.app](https:-ai/-ai/swr.vercel.app)
