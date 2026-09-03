# ChatGPT WebMCP Deployment Guide for AmbiOS AI

**Complete Guide to Deploying AmbiOS AI as Site Tools on ChatGPT**

**Last Updated:** August 31, 2026

**Evidence status:** `BLOCKED` pending a successful HTTPS deployment and live ChatGPT Site Tools discovery/execution. Use `PASS` only for directly reproduced evidence and `FAIL` for an attempted check that does not meet its requirement.

---

## Executive Summary

**ChatGPT now supports WebMCP** (announced August 25, 2026) in its **desktop app built-in browser**, **ChatGPT Work**, and **Codex**. This means AmbiOS AI can be deployed as **Site Tools** that ChatGPT agents can discover and use when visiting your site.

**Key advantages:**
- ✅ No origin trial token required (unlike Chrome)
- ✅ No registration or approval process
- ✅ Works with user's existing authenticated session
- ✅ Agents see and call registered tools automatically
- ✅ Available in ChatGPT desktop app, Work, and Codex

---

## 1. Requirements

### 1.1 Technical Requirements

- ✅ **HTTPS only** - Site must be served over HTTPS with valid certificates
- ✅ **Modern browser support** - JavaScript module with feature detection
- ✅ **Publicly accessible domain** - No localhost for production
- ✅ **Content Security Policy (CSP)** - Must allow `navigator.modelContext` API calls

### 1.2 ChatGPT Requirements

- ✅ **ChatGPT desktop app** - Latest version (updated after Aug 25, 2026)
- ✅ **Supported models** - GPT-5.6 Sol or GPT-5.6 Terra (GPT-5.6 Luna has WebMCP disabled)
- ✅ **Not available** - Enterprise or Edu workspaces (as of Aug 2026)

### 1.3 User Controls

Users can disable site tools in:
- **Settings > Browser > Permissions > Enable site tools** (toggle off)

---

## 2. Implementation Steps

### 2.1 Step 1: Feature Detection

Check for browser support before registering tools:

```typescript
// lib/webmcp/chatgpt-detection.ts

export function hasWebMCPSupport(): boolean {
  return typeof document.modelContext?.registerTool === "function";
}

// Usage
if (hasWebMCPSupport()) {
  console.log('✅ WebMCP supported - registering tools');
  // Register tools here
} else {
  console.log('⚠️ WebMCP not supported - falling back to regular UI');
}
```

### 2.2 Step 2: Register Tools

Register tools in your page's JavaScript module:

```typescript
// lib/webmcp/chatgpt-tools.ts

import { hasWebMCPSupport } from './chatgpt-detection';

export async function registerChatGPTTools() {
  if (!hasWebMCPSupport()) {
    console.warn('WebMCP not supported in this browser');
    return;
  }

  // Register all AmbiOS tools
  await registerAmbiosTools();
  await registerVendorTools();
  await registerSecurityTools();
}

async function registerAmbiosTools() {
  // Example: Get current user
  await document.modelContext.registerTool({
    name: "ambios_get_current_user",
    description: "Get the current authenticated user and organization context in AmbiOS AI.",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
    annotations: {
      readOnlyHint: true,  // Important: tells ChatGPT this is read-only
    },
    execute: async () => {
      const response = await fetch('/api/identity/me');
      const user = await response.json();
      
      return {
        user: user,
        organization: user.organization,
        permissions: user.permissions,
      };
    },
  });

  // Example: Get incident context
  await document.modelContext.registerTool({
    name: "ambios_get_incident_context",
    description: "Retrieves incident details, service state, recent deploys, alerts, and related metadata for an incident in AmbiOS AI.",
    inputSchema: {
      type: "object",
      properties: {
        incidentId: {
          type: "string",
          description: "The unique identifier of the incident.",
        },
      },
      required: ["incidentId"],
      additionalProperties: false,
    },
    annotations: {
      readOnlyHint: true,
    },
    execute: async (args: { incidentId: string }) => {
      const response = await fetch(`/api/incident/${args.incidentId}/context`);
      const context = await response.json();
      
      return {
        incident: context.incident,
        serviceState: context.serviceState,
        recentDeploys: context.recentDeploys,
        alerts: context.alerts,
      };
    },
  });
}

async function registerVendorTools() {
  // Cloudflare deploy tool
  await document.modelContext.registerTool({
    name: "ambios_deploy_worker",
    description: "Deploys a Cloudflare Worker with the current configuration. Requires human approval for production deploys.",
    inputSchema: {
      type: "object",
      properties: {
        workerName: {
          type: "string",
          description: "Name of the Worker to deploy",
        },
        environment: {
          type: "string",
          enum: ["production", "staging"],
          description: "Deployment environment",
        },
      },
      required: ["workerName", "environment"],
      additionalProperties: false,
    },
    annotations: {
      readOnlyHint: false,  // This tool mutates state
      untrustedContentHint: true,  // Output may contain untrusted data
    },
    execute: async (args: { workerName: string; environment: string }) => {
      // Check if approval is required (production deploys)
      if (args.environment === "production") {
        // Trigger approval gate
        const approval = await triggerApprovalGate({
          action: "deploy_worker",
          riskLevel: "high",
          details: args,
        });
        
        if (!approval.approved) {
          throw new Error("Deployment denied: Approval required for production deploys");
        }
      }
      
      // Execute deployment
      const response = await fetch('/api/deploy/worker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(args),
      });
      
      const result = await response.json();
      
      return {
        success: result.success,
        deploymentUrl: result.deploymentUrl,
        version: result.version,
        environment: args.environment,
      };
    },
  });
}

async function registerSecurityTools() {
  // Snyk scan tool
  await document.modelContext.registerTool({
    name: "ambios_snyk_scan_project",
    description: "Runs a security scan on a Snyk project and returns vulnerabilities. Use this to check for security issues in dependencies.",
    inputSchema: {
      type: "object",
      properties: {
        projectId: {
          type: "string",
          description: "The Snyk project ID to scan",
        },
        scanType: {
          type: "string",
          enum: ["dependencies", "code", "container", "iac"],
          description: "Type of security scan to run",
        },
      },
      required: ["projectId", "scanType"],
      additionalProperties: false,
    },
    annotations: {
      readOnlyHint: true,
    },
    execute: async (args: { projectId: string; scanType: string }) => {
      const response = await fetch('/api/integrations/snyk/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(args),
      });
      
      const result = await response.json();
      
      return {
        scanId: result.scanId,
        vulnerabilities: result.vulnerabilities,
        totalCount: result.vulnerabilities?.length || 0,
        severityBreakdown: {
          critical: result.vulnerabilities?.filter(v => v.severity === 'critical').length || 0,
          high: result.vulnerabilities?.filter(v => v.severity === 'high').length || 0,
          medium: result.vulnerabilities?.filter(v => v.severity === 'medium').length || 0,
          low: result.vulnerabilities?.filter(v => v.severity === 'low').length || 0,
        },
      };
    },
  });
}

async function triggerApprovalGate(config: {
  action: string;
  riskLevel: string;
  details: any;
}): Promise<{ approved: boolean }> {
  // Dispatch custom event to trigger React approval modal
  return new Promise((resolve) => {
    const event = new CustomEvent('ambios:approval-required', { detail: config });
    window.dispatchEvent(event);
    
    // Listen for approval response
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent;
      resolve({ approved: customEvent.detail.approved });
      window.removeEventListener('ambios:approval-response', handler);
    };
    
    window.addEventListener('ambios:approval-response', handler);
  });
}
```

### 2.3 Step 3: Initialize on App Load

```typescript
// app/layout.tsx

import { registerChatGPTTools } from '@/lib/webmcp/chatgpt-tools';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Register tools on mount
  React.useEffect(() => {
    registerChatGPTTools();
  }, []);

  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

### 2.4 Step 4: Handle Tool Lifecycle

```typescript
// lib/webmcp/tool-lifecycle.ts

export function registerToolWithCleanup(toolConfig: any) {
  const controller = new AbortController();
  
  document.modelContext.registerTool(toolConfig, {
    signal: controller.signal,
  });
  
  // Return cleanup function
  return () => {
    controller.abort();
  };
}

// Usage in React component
export function useToolRegistration(toolConfig: any) {
  React.useEffect(() => {
    const cleanup = registerToolWithCleanup(toolConfig);
    return cleanup;  // Cleanup on unmount
  }, [toolConfig]);
}
```

---

## 3. Security Considerations

### 3.1 ChatGPT Security Model

**Important:** ChatGPT treats all website-provided tool definitions and results as **untrusted content**.

**Security measures ChatGPT applies:**
- ✅ Each tool invocation receives a safety review before execution
- ✅ Normal website access and confirmation policies apply
- ✅ Consequential actions (sending messages, making purchases, deleting data, changing permissions) require user confirmation
- ✅ Browser ties each invocation to its originating page and tool registration
- ✅ Users can disable site tools in Settings

### 3.2 Your Security Responsibilities

**You must:**
- ✅ Reuse your application's existing authentication and authorization
- ✅ Validate all inputs (don't trust client-side parameters)
- ✅ Preserve the normal UI for people and browsers that don't support WebMCP
- ✅ Keep inputs narrow and describe side effects in tool descriptions
- ✅ Return enough information to verify the result
- ✅ Implement approval gates for sensitive actions
- ✅ Log all tool invocations for audit trail

**Example security middleware:**

```typescript
// lib/webmcp/security-middleware.ts

export async function secureToolExecute(
  toolName: string,
  executeFn: Function,
  args: any,
  user: any
): Promise<any> {
  // 1. Verify authentication
  if (!user || !user.isAuthenticated) {
    throw new Error('Authentication required');
  }
  
  // 2. Verify authorization
  const hasPermission = await checkPermission(user, toolName);
  if (!hasPermission) {
    throw new Error(`Permission denied: ${toolName}`);
  }
  
  // 3. Validate inputs
  const validatedArgs = await validateInput(toolName, args);
  
  // 4. Check rate limits
  await checkRateLimit(user.id, toolName);
  
  // 5. Execute tool
  const result = await executeFn(validatedArgs);
  
  // 6. Log for audit
  await logToolInvocation({
    toolName,
    userId: user.id,
    args: validatedArgs,
    result,
    timestamp: new Date().toISOString(),
  });
  
  return result;
}

async function checkPermission(user: any, toolName: string): Promise<boolean> {
  // Check user permissions
  const requiredPermissions = getRequiredPermissions(toolName);
  return requiredPermissions.every(perm => user.permissions?.includes(perm));
}

async function validateInput(toolName: string, args: any): Promise<any> {
  // Validate against schema
  const schema = getToolSchema(toolName);
  const result = schema.safeParse(args);
  
  if (!result.success) {
    throw new Error(`Invalid input: ${result.error.message}`);
  }
  
  return result.data;
}

async function checkRateLimit(userId: string, toolName: string): Promise<void> {
  // Implement rate limiting
  const limit = getRateLimit(toolName);
  const count = await getInvocationCount(userId, toolName, '1h');
  
  if (count >= limit) {
    throw new Error(`Rate limit exceeded for ${toolName}`);
  }
}
```

### 3.3 Content Security Policy (CSP)

Update your CSP headers to allow WebMCP API calls:

```typescript
// next.config.ts

const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "connect-src 'self' https://api.ambios.ai",
      "frame-ancestors 'none'",
    ].join('; '),
  },
];

module.exports = {
  headers: async () => [
    {
      source: '/(.*)',
      headers: securityHeaders,
    },
  ],
};
```

---

## 4. Testing

### 4.1 Test in ChatGPT Desktop App

**Step 1:** Update ChatGPT desktop app to latest version

**Step 2:** Open AmbiOS AI in built-in browser

- Launch ChatGPT desktop app
- Navigate to `https://ambios.ai` in the built-in browser
- Or use "Open in ChatGPT" button from your site

**Step 3:** Verify tools are discovered

- Click **Site tools** in browser's address bar
- Select **Available site tools**
- Verify all registered tools appear

**Step 4:** Test tool execution

- Ask ChatGPT: "Help me investigate the api-prod incident"
- Agent should discover and use your tools
- Review tool invocations in **Recently used**

### 4.2 Test with ChatGPT Work

**Step 1:** Enable ChatGPT Work

- Open ChatGPT desktop app
- Select **Work** mode
- Navigate to AmbiOS AI

**Step 2:** Test agent workflows

- Ask: "Deploy the worker to staging"
- Agent should use `ambios_deploy_worker` tool
- Verify approval gate triggers for production deploys

### 4.3 Test with Codex

**Step 1:** Open Codex

- Launch Codex from ChatGPT desktop app
- Navigate to AmbiOS AI

**Step 2:** Test code-related tools

- Ask: "Scan the project for vulnerabilities"
- Agent should use `ambios_snyk_scan_project` tool
- Verify results are displayed correctly

---

## 5. Deployment Checklist

### Pre-Launch

- [ ] Site served over HTTPS with valid certificates
- [ ] CSP headers configured to allow WebMCP API calls
- [ ] Feature detection implemented (`hasWebMCPSupport()`)
- [ ] All tools registered with proper schemas
- [ ] Annotations set correctly (`readOnlyHint`, `untrustedContentHint`)
- [ ] Authentication/authorization checks in place
- [ ] Input validation implemented
- [ ] Rate limiting configured
- [ ] Audit logging enabled
- [ ] Approval gates for sensitive actions
- [ ] Error handling and user feedback
- [ ] Tools tested in ChatGPT desktop app
- [ ] Tools tested in ChatGPT Work
- [ ] Tools tested in Codex

### Post-Launch

- [ ] Monitor tool invocations
- [ ] Track error rates
- [ ] Review audit logs
- [ ] Gather user feedback
- [ ] Iterate on tool descriptions
- [ ] Add new tools based on usage patterns
- [ ] Performance optimization

---

## 6. Best Practices

### 6.1 Tool Design

**Do:**
- ✅ Use clear, descriptive tool names (e.g., `ambios_get_incident_context`)
- ✅ Write natural language descriptions that accurately reflect what the tool does
- ✅ Define narrow input schemas with clear property descriptions
- ✅ Return structured, verifiable results
- ✅ Set `readOnlyHint: true` for read-only operations
- ✅ Set `untrustedContentHint: true` for outputs that may contain untrusted data
- ✅ Reuse existing application logic and permissions

**Don't:**
- ❌ Register tools that duplicate existing ChatGPT capabilities
- ❌ Expose sensitive operations without approval gates
- ❌ Trust client-side parameters (always validate server-side)
- ❌ Register tools in iframes (not supported by ChatGPT)
- ❌ Use declarative API (not supported by ChatGPT - use imperative API only)

### 6.2 Error Handling

```typescript
// lib/webmcp/error-handling.ts

export async function handleToolError(
  toolName: string,
  error: Error,
  args: any
): Promise<never> {
  // Log error
  await logError({
    toolName,
    error: error.message,
    args,
    timestamp: new Date().toISOString(),
  });
  
  // Return user-friendly error message
  if (error.message.includes('Authentication')) {
    throw new Error('Please sign in to use this tool');
  }
  
  if (error.message.includes('Permission')) {
    throw new Error('You do not have permission to perform this action');
  }
  
  if (error.message.includes('Rate limit')) {
    throw new Error('Too many requests. Please try again later');
  }
  
  // Default error
  throw new Error(`Tool execution failed: ${error.message}`);
}
```

### 6.3 Performance Optimization

```typescript
// lib/webmcp/performance.ts

// Cache tool registrations
const toolCache = new Map<string, any>();

export async function getCachedTool(name: string): Promise<any> {
  if (toolCache.has(name)) {
    return toolCache.get(name);
  }
  
  const tool = await fetchTool(name);
  toolCache.set(name, tool);
  return tool;
}

// Lazy-load heavy tools
export async function registerToolsLazy() {
  // Register critical tools first
  await registerCriticalTools();
  
  // Defer non-critical tools
  requestIdleCallback(() => {
    registerNonCriticalTools();
  });
}
```

---

## 7. Limitations

### 7.1 ChatGPT-Specific Limitations

**Not supported:**
- ❌ **Declarative API** - Tools defined through HTML form attributes
- ❌ **Tools in iframes** - Same-origin or cross-origin iframes
- ❌ **Enterprise/Edu workspaces** - Not available (as of Aug 2026)
- ❌ **GPT-5.6 Luna** - WebMCP disabled on this model

**Workarounds:**
- ✅ Use imperative API (JavaScript `registerTool()`)
- ✅ Register tools in top-level page only
- ✅ Use ChatGPT desktop app (not web) with GPT-5.6 Sol or Terra

### 7.2 WebMCP Specification Limitations

**ChatGPT supports a subset of WebMCP APIs:**
- ✅ Imperative API (`document.modelContext.registerTool`)
- ✅ Tool execution and result handling
- ❌ Declarative API (HTML form attributes)
- ❌ `provideContext()` for state-dependent tools
- ❌ Cross-origin tool discovery

---

## 8. Example: Complete Implementation

```typescript
// app/ambios-webmcp-provider.tsx

"use client";

import { useEffect, useState } from 'react';
import { hasWebMCPSupport } from '@/lib/webmcp/chatgpt-detection';
import { registerChatGPTTools } from '@/lib/webmcp/chatgpt-tools';

export function AmbiosWebMCPProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function initialize() {
      if (hasWebMCPSupport()) {
        console.log('✅ WebMCP supported - initializing tools');
        await registerChatGPTTools();
        setIsReady(true);
      } else {
        console.log('⚠️ WebMCP not supported - using fallback');
        setIsReady(false); // Do not claim readiness when WebMCP is unavailable
      }
    }
    
    initialize();
  }, []);

  return (
    <>
      {isReady ? children : <div>Loading WebMCP tools...</div>}
    </>
  );
}
```

```typescript
// app/layout.tsx

import { AmbiosWebMCPProvider } from './ambios-webmcp-provider';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AmbiosWebMCPProvider>
          {children}
        </AmbiosWebMCPProvider>
      </body>
    </html>
  );
}
```

---

## 9. Monitoring & Analytics

### 9.1 Track Tool Usage

```typescript
// lib/analytics/webmcp-tracking.ts

export async function trackToolInvocation(
  toolName: string,
  userId: string,
  result: 'success' | 'error' | 'denied',
  duration: number
) {
  // Send to analytics
  await fetch('/api/analytics/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event: 'tool_invocation',
      properties: {
        toolName,
        userId,
        result,
        duration,
        source: 'chatgpt',
        timestamp: new Date().toISOString(),
      },
    }),
  });
}
```

### 9.2 Error Monitoring

```typescript
// lib/monitoring/webmcp-errors.ts

export async function reportToolError(
  toolName: string,
  error: Error,
  context: {
    userId: string;
    args: any;
    userAgent: string;
  }
) {
  // Send to error tracking (e.g., Sentry)
  await fetch('/api/monitoring/error', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      toolName,
      error: {
        message: error.message,
        stack: error.stack,
      },
      context,
      timestamp: new Date().toISOString(),
    }),
  });
}
```

---

## 10. Resources

- **ChatGPT WebMCP Docs:** https://learn.chatgpt.com/docs/webmcp
- **WebMCP Spec:** https://github.com/webmachinelearning/webmcp
- **Chrome Developer Guide:** https://developer.chrome.com/docs/ai/webmcp
- **OpenAI Plugins:** https://developers.openai.com/plugins
- **Stacktree Blog:** https://stacktr.ee/blog/chatgpt-webmcp

---

## 11. Summary

**Deployment Steps:**

1. ✅ Implement feature detection (`hasWebMCPSupport()`)
2. ✅ Register tools with `document.modelContext.registerTool()`
3. ✅ Set proper annotations (`readOnlyHint`, `untrustedContentHint`)
4. ✅ Implement security middleware (auth, validation, rate limiting)
5. ✅ Add approval gates for sensitive actions
6. ✅ Test in ChatGPT desktop app (GPT-5.6 Sol/Terra)
7. ✅ Monitor tool usage and errors
8. ✅ Iterate based on feedback

**Key Points:**

- ✅ No origin trial token required (unlike Chrome)
- ✅ No registration or approval process
- ✅ Works with user's existing authenticated session
- ✅ Agents discover tools automatically
- ✅ Security is your responsibility (validate inputs, check permissions)
- ✅ Not available in Enterprise/Edu workspaces

**Deployment decision:** `BLOCKED` until the HTTPS deployment and live ChatGPT Site Tools checks in this guide pass. This guide documents the required path; it is not evidence that deployment is complete.

---

**This guide provides the implementation and verification steps for deploying AmbiOS AI as Site Tools on ChatGPT. Successful deployment must be recorded as `PASS`; unavailable or unverified external checks remain `BLOCKED`, and failed checks are `FAIL`.**
