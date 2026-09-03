import { existsSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");

const required = [
  "apps/web/src/components/agent/AgentInterface.tsx",
  "apps/web/src/components/agent/AgentInputArea.tsx",
  "apps/web/src/components/agent/ConversationHistory.tsx",
  "apps/web/src/components/sidebar/LeftSidebar.tsx",
  "apps/web/src/components/sidebar/RightSidebar.tsx",
  "apps/web/src/components/ui/expandable-bento-grid.tsx",
  "apps/web/src/components/canvas/Canvas.tsx",
  "apps/web/src/components/canvas/AgentCursor.tsx",
  "apps/web/src/app/globals.css",
];

const missing = required.filter((relativePath) => !existsSync(resolve(root, relativePath)));
if (missing.length > 0) {
  console.error(`Frontend source audit failed; missing canonical files:\n${missing.join("\n")}`);
  process.exit(1);
}

console.log(`Frontend source audit passed: ${required.length} canonical UI surfaces verified.`);
