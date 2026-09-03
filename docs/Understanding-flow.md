## What is WebMCP?

**WebMCP (Web Model Context Protocol)** is a **browser API standard** that lets websites expose structured tools directly to AI agents, replacing the old "screenshot → analyze → click" pattern with direct function calls.

Think of it as: **"API endpoints, but for AI agents visiting your website"**

***

## The Problem WebMCP Solves

### Before WebMCP (The Old Way):

```
User: "Deploy my app to production"
     ↓
AI Agent: Takes screenshot of website
     ↓
AI Agent: Analyzes DOM structure
     ↓
AI Agent: Tries to find "Deploy" button
     ↓
AI Agent: Clicks button (might be wrong button)
     ↓
Result: Fragile, slow, error-prone
```

**Issues:**
- ❌ Screen scraping is brittle (UI changes break it)
- ❌ Can't authenticate (no access to user's session)
- ❌ No structured data (just pixels)
- ❌ No error handling (what if button moves?)
- ❌ Security risks (agent might click wrong thing)

***

### With WebMCP (The New Way):

```
User: "Deploy my app to production"
     ↓
AI Agent: Discovers `deploy_app` tool on website
     ↓
AI Agent: Calls tool with parameters
     ↓
Website: Executes deployment (with user's auth)
     ↓
Website: Returns structured result
     ↓
Result: Fast, reliable, secure
```

**Benefits:**
- ✅ Structured tool definitions (clear inputs/outputs)
- ✅ Uses user's existing authentication
- ✅ Fast direct function calls
- ✅ Built-in error handling
- ✅ Security controls (approval gates, permissions)

***

## How WebMCP Works (Technical Flow)

### 1. **Tool Registration** (Website Side)

When a user visits your site, your JavaScript registers tools:

```javascript
// Your website's JavaScript
document.modelContext.registerTool({
  name: "deploy_app",
  description: "Deploys the current app to a specified environment",
  inputSchema: {
    type: "object",
    properties: {
      environment: {
        type: "string",
        enum: ["staging", "production"],
        description: "Target deployment environment"
      }
    },
    required: ["environment"]
  },
  execute: async (args) => {
    // Your implementation
    const response = await fetch('/api/deploy', {
      method: 'POST',
      body: JSON.stringify(args)
    });
    return await response.json();
  }
});
```

**What happens:**
- Browser stores tool definition in `document.modelContext`
- Tool is now discoverable by AI agents
- Tool is tied to your website's origin (security)

***

### 2. **Agent Discovery** (AI Side)

When an AI agent visits your site (via browser), it can discover tools:

```javascript
// AI agent's browser
const tools = await document.modelContext.getTools();
// Returns: [{ name: "deploy_app", description: "...", inputSchema: {...} }]
```

**What happens:**
- Agent queries browser for available tools
- Browser returns list of registered tools
- Agent now knows what actions are available

***

### 3. **Tool Execution** (AI → Website)

Agent decides to use a tool:

```javascript
// AI agent calls tool
const result = await document.modelContext.executeTool(
  { name: "deploy_app" },
  JSON.stringify({ environment: "staging" })
);
// Returns: { success: true, deploymentUrl: "https://..." }
```

**What happens:**
1. Agent sends tool call to browser
2. Browser routes call to originating website
3. Website executes tool (with user's auth session)
4. Website returns structured result
5. Browser sends result back to agent

***

### 4. **User Control** (Security)

Users can see and control tool usage:

**Browser UI shows:**
- 🔍 "Site tools" button in address bar
- 📋 List of available tools
- ⏹️ "Recently used" tool invocations
- ⚙️ Settings to disable site tools

**User can:**
- ✅ See which tools are registered
- ✅ See which tools agent is using
- ✅ Disable site tools entirely
- ✅ Review tool results

***

## User Flow Examples

### Example 1: User Asks Agent to Deploy App

**Scenario:** User is on Vercel dashboard, asks ChatGPT to deploy

```
1. User opens ChatGPT desktop app
2. User navigates to vercel.com in built-in browser
3. User asks: "Deploy my app to production"
4. ChatGPT agent:
   - Discovers `vercel_deploy` tool via WebMCP
   - Calls tool with { environment: "production" }
   - Vercel executes deployment (using user's session)
   - Returns: { success: true, url: "https://..." }
5. ChatGPT responds: "✅ Deployed! View at https://..."
6. User sees deployment in "Recently used" tools
```

**Key point:** User is already logged into Vercel. Agent uses that session. No API keys needed.

***

### Example 2: Security Scan with Approval

**Scenario:** User asks agent to scan for vulnerabilities

```
1. User on AmbiOS AI dashboard
2. User asks: "Check for security issues"
3. AmbiOS agent:
   - Discovers `snyk_scan_project` tool
   - Calls tool with { projectId: "abc123" }
   - Snyk scans project
   - Returns: { vulnerabilities: [...], severity: "high" }
4. Agent proposes: "Found 3 vulnerabilities. Fix them?"
5. User approves
6. Agent calls `snyk_apply_fix` tool
7. Snyk applies fix (creates PR)
8. User sees result in chat
```

**Key point:** Sensitive actions (applying fixes) can require user approval.

***

### Example 3: Multi-Step Workflow

**Scenario:** User asks agent to investigate incident

```
1. User on AmbiOS AI incident dashboard
2. User asks: "What's causing the api-prod errors?"
3. AmbiOS agent:
   - Calls `get_incident_context` tool
   - Calls `cloudflare_get_worker_logs` tool
   - Calls `snyk_scan_project` tool
   - Calls `datadog_get_metrics` tool
4. Agent analyzes results
5. Agent responds: "Found critical vulnerability in lodash.
   High error rate correlates with recent deploy.
   Recommend: rollback + security fix."
6. User: "Do it"
7. Agent executes rollback and fix (with approval)
```

**Key point:** Agent can chain multiple tool calls to complete complex tasks.

***

## Key Behaviors

### 1. **Origin-Bound Security**

Tools are tied to the website's origin:
- `ambios.ai` tools only work on `ambios.ai`
- Cannot be called from other sites
- Prevents cross-site tool injection attacks

### 2. **Session-Based Auth**

Tools execute in user's browser context:
- Uses user's existing authentication
- No API keys or tokens needed
- Respects user's permissions (can't do things user can't do)

### 3. **Structured I/O**

Tools have clear input/output schemas:
- Inputs: JSON with typed properties
- Outputs: JSON with structured data
- Agent knows exactly what to expect

### 4. **Human-in-the-Loop**

Sensitive actions require approval:
- Deployments to production
- Deleting resources
- Financial transactions
- Security changes

### 5. **Audit Trail**

All tool calls are logged:
- User can see "Recently used" tools
- Website can log invocations server-side
- Compliance and debugging

***

## Browser Support

### Currently Supported:

| Browser | Status | Notes |
|---------|--------|-------|
| **Chrome** | Origin trial | Requires `chrome://flags/#enable-webmcp-testing` |
| **ChatGPT Desktop** | ✅ Production | Built-in browser, no flags needed |
| **Brave Nightly** | Experimental | Early support |
| **Edge** | Coming soon | In development |

### Future:
- Firefox (planned)
- Safari (planned)
- All major browsers (eventually)

***

## WebMCP vs Related Technologies

### WebMCP vs MCP (Model Context Protocol)

| Aspect | MCP | WebMCP |
|--------|-----|--------|
| **Transport** | Stdio, HTTP, WebSocket | Browser API |
| **Use Case** | Desktop CLI tools, servers | Websites, web apps |
| **Auth** | API keys, OAuth | Browser session |
| **Discovery** | MCP server registry | `document.modelContext.getTools()` |

**Relationship:** WebMCP is a **browser-native implementation** of MCP concepts.

***

### WebMCP vs Traditional APIs

| Aspect | REST API | WebMCP |
|--------|----------|--------|
| **Client** | HTTP client (curl, fetch) | AI agent in browser |
| **Auth** | API keys, JWT | Browser session |
| **Discovery** | OpenAPI/Swagger | `document.modelContext.getTools()` |
| **Use Case** | Programmatic access | Agent interaction |

**Key difference:** WebMCP is designed for **AI agents**, not human developers.

***

### WebMCP vs Browser Automation (Selenium, Puppeteer)

| Aspect | Selenium/Puppeteer | WebMCP |
|--------|-------------------|--------|
| **Approach** | DOM scraping, clicking | Direct function calls |
| **Reliability** | Fragile (UI changes break it) | Stable (API contract) |
| **Speed** | Slow (render, click, wait) | Fast (direct call) |
| **Security** | Can't access auth session | Uses user's session |

**Key difference:** WebMCP is **structured and intentional**, not screen scraping.

***

## Security Model

### Threat Vectors WebMCP Addresses:

1. **Prompt Injection**
   - Agent might be tricked into calling wrong tools
   - Mitigation: User sees tool calls, can disable

2. **Tool Poisoning**
   - Malicious site might register harmful tools
   - Mitigation: Origin-bound, user must visit site

3. **Unauthorized Actions**
   - Agent might do things user didn't intend
   - Mitigation: Approval gates for sensitive actions

4. **Data Leakage**
   - Tool outputs might contain sensitive data
   - Mitigation: `untrustedContentHint` annotation

### Your Responsibilities as Developer:

- ✅ Validate all inputs (don't trust client-side)
- ✅ Check user permissions (can user do this action?)
- ✅ Implement rate limiting (prevent abuse)
- ✅ Log all invocations (audit trail)
- ✅ Use approval gates for sensitive actions
- ✅ Return minimal necessary data (privacy)

***

## Real-World Analogy

**Think of WebMCP like a restaurant menu:**

- **Menu** = Tool definitions (what's available)
- **Ordering** = Tool execution (calling the tool)
- **Kitchen** = Your backend (executes the action)
- **Waiter** = Browser (routes requests)
- **Customer** = AI agent (makes requests)
- **Restaurant owner** = User (pays, controls experience)

**Without WebMCP (old way):**
- Agent has to guess what's on menu by looking through kitchen window
- Agent has to sneak into kitchen and cook themselves
- Fragile, slow, insecure

**With WebMCP (new way):**
- Agent reads menu (structured tool definitions)
- Agent places order (calls tool)
- Kitchen prepares food (executes action)
- Waiter brings food back (returns result)
- Fast, reliable, secure

***

## Summary

**WebMCP is:**
- A browser API for exposing tools to AI agents
- Structured, fast, secure alternative to screen scraping
- Uses user's existing authentication (no API keys)
- Origin-bound for security
- Human-in-the-loop for sensitive actions

**User flow:**
1. User visits website
2. Website registers tools
3. User asks AI agent to do something
4. Agent discovers and calls tools
5. Website executes actions
6. Agent reports results to user

**Key insight:** WebMCP turns **websites into API endpoints for AI agents**, enabling reliable, secure agent interactions without the fragility of DOM scraping.

***
