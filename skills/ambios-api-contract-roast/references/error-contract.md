# Error contract

Use a stable envelope for API failures:

```json
{
  "error": {
    "code": "STABLE_MACHINE_CODE",
    "message": "Safe human-readable explanation.",
    "request_id": "request-id",
    "next_step": "Action the caller can safely take."
  }
}
```

For unavailable features use `status: "unsupported"`, a stable capability code, safe message, and next step. Preserve HTTP semantics; do not return `200` for a failed mutation or an HTML app shell from an API path. Redact tokens, secrets, raw authorization headers, provider credentials, and untrusted payloads.

