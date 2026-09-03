# Connect your own ChatGPT account to AmbiOS

Users bring their own ChatGPT account. They connect ChatGPT to AmbiOS through
the AmbiOS remote MCP OAuth flow. ChatGPT calls permitted AmbiOS MCP tools,
while AmbiOS remains the control plane for identity, permissions, proposals,
policy, exact approvals, execution, independent verification, and audit.

This is separate from WebMCP. WebMCP is browser-local registration in the
AmbiOS web application for compatible browser agents; it does not replace
remote MCP OAuth or server-side authorization.

## User flow

1. Sign in to AmbiOS and select an organization and workspace.
2. Add the canonical public MCP resource from `MCP_SERVER_URL` in
   `.env.example` to the supported ChatGPT Apps/MCP surface. In production this
   is the Cloudflare Core Worker resource. Vercel is used only for the browser
   consent/login UI after OAuth redirects; it is not a second MCP resource.
3. ChatGPT discovers AmbiOS authorization metadata and opens AmbiOS consent.
4. Review the requested least-privilege scopes and authorize the selected workspace.
5. ChatGPT can read permitted context and create governed proposals.
6. Review consequential actions in AmbiOS. Chat text is never an approval.
7. AmbiOS executes only after an exact, server-bound, expiring, single-use approval, then verifies the provider result and records the audit trail.

## Scope model

AmbiOS issues explicit scopes such as `ambios.workspace.read`,
`ambios.incidents.read`, `ambios.systems.read`, `ambios.tools.read`,
`ambios.runs.read`, `ambios.audit.read`, `ambios.proposals.create`,
`ambios.policy.read`, `ambios.approvals.request`, `ambios.approvals.read`,
`ambios.actions.read`, and `ambios.verification.read`. The remote MCP connection does not issue a blanket
provider-write scope and never transfers provider credentials to ChatGPT.

The server validates the opaque token, resource audience, expiry, identity,
organization, workspace, role, capability, resource mapping, and request
schema before calling the same domain services used by the AmbiOS UI and
WebMCP adapter. Consequential work additionally requires policy evaluation,
exact approval binding, idempotency, independent verification, and audit.

## Runtime configuration

Configure the MCP resource and authorization server only in the Cloudflare
Worker environment. `MCP_SERVER_URL`, `MCP_AUTHORIZATION_SERVER_URL`, and
`MCP_AUTH_UI_URL` are public URL configuration; Nango and provider credentials
remain server-only. Do not place provider credentials, ChatGPT credentials,
authorization codes, or tokens in the browser, URLs after callback handling,
analytics, model-visible output, or logs.

For local development, `AUTH_DISABLE=true` is accepted only in a development
runtime. It is not a production authentication mode and cannot prove a live
ChatGPT connection.

## Truthful support labels

Remote MCP OAuth is `Live` only when deployed HTTPS metadata, consent, token
exchange, scoped tool call, revocation, and audit checks pass. WebMCP is a
separate browser capability. ChatGPT client availability is dependent on the
client/workspace surface; unsupported clients are labeled `Unsupported`.
Provider execution is `Unverified` or `Not configured` until a real
least-privilege provider action and independent provider-side verification are
recorded.

Official references:

- [Apps in ChatGPT](https://help.openai.com/en/articles/11487775)
- [Build with the Apps SDK](https://help.openai.com/en/articles/12515353-build-with-the-apps-sdk)
- [MCP authorization](https://modelcontextprotocol.io/specification/2025-11-25/basic/authorization)
