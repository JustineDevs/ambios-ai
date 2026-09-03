import { operationPath, safeStringify } from "@ambios-ai/shared";
import { useMemo } from "react";
import { useConfig } from "@/app/config-context";

export interface ToolCodeSnippets {
  typescriptCode: string;
  pythonCode: string;
  curlCommand: string;
  mcpConfig: string;
}

export function useToolCodeSnippets(
  toolId: string,
  payload: Record<string, any> = {},
): ToolCodeSnippets {
  const config = useConfig();

  return useMemo(() => {
    const mcpEndpoint = `${config.apiEndpoint}${operationPath("mcp")}`;
    const typescriptCode = `// AmbiOS tool execution is governed through remote MCP OAuth.
// Obtain a scoped token by connecting your own ChatGPT/MCP client; do not paste provider keys.
const response = await fetch("${mcpEndpoint}", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: "Bearer <OAUTH_ACCESS_TOKEN>"
  },
  body: JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "tools/call",
    params: { name: "${toolId}", arguments: ${safeStringify(payload, 2)} }
  })
});
console.log(await response.json());`;

    const pythonCode = `# AmbiOS execution requires a token issued by the remote MCP OAuth flow.
# It is scoped to the authorized AmbiOS workspace and never contains provider credentials.
import json, urllib.request
request = urllib.request.Request(
    "${mcpEndpoint}",
    data=json.dumps({"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"${toolId}","arguments":${safeStringify(payload)}}}).encode(),
    headers={"Content-Type":"application/json","Authorization":"Bearer <OAUTH_ACCESS_TOKEN>"},
    method="POST")
print(json.load(urllib.request.urlopen(request)))`;

    const curlCommand = `curl -X POST "${mcpEndpoint}" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer <OAUTH_ACCESS_TOKEN>" \\
  -d '${safeStringify({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: toolId, arguments: payload } })}'`;

    const mcpConfig = `{
  "mcpServers": {
    "ambios": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "${mcpEndpoint}",
        "--header",
        "Authorization:\${AUTH_HEADER}"
      ],
      "env": {
        "AUTH_HEADER": "Bearer <YOUR_AMBIOS_API_KEY>"
      }
    }
  }
}`;

    return {
      typescriptCode,
      pythonCode,
      curlCommand,
      mcpConfig,
    };
  }, [config.apiEndpoint, toolId, payload]);
}
