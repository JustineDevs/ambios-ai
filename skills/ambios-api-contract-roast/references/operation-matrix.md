# Operation matrix

| Operation | Method/path | Contract | Implementation | Auth/scope | Input | Output/errors | Mutation controls | Audit | Unit/integration | Live proof | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

## Roast questions

1. Can a caller reach the documented route directly and through the frontend rewrite?
2. Does the implementation return the documented status and schema on success and failure?
3. Is tenant/resource scope derived from trusted identity rather than request input?
4. Can retries duplicate work or can concurrent requests bypass policy/approval?
5. Does the route create durable evidence when it mutates or authorizes anything?
6. Are list, export, upload, and provider calls bounded?
7. Does the UI accurately label unavailable, unsupported, unverified, and failed states?

