import type { SkillName } from "../skills/index";

export const BASE_TOOLS = [
  "load_skill",
  "find_tool",
  "find_system",
  "search_documentation",
  "call_system",
  "get_runs",
  "run_tool",
];

export const TOOL_BUILDING_TOOLS = ["build_tool", "save_tool"];
export const TOOL_EDITING_TOOLS = ["edit_tool", "save_tool"];
export const SYSTEMS_HANDLING_TOOLS = ["create_system", "edit_system", "authenticate_oauth"];

export const SKILL_GATED_TOOLS: Partial<Record<SkillName, string[]>> = {
  "tool-building": TOOL_BUILDING_TOOLS,
  "tool-editing": TOOL_EDITING_TOOLS,
  "systems-handling": SYSTEMS_HANDLING_TOOLS,
};

export const AGENT_TOOL_SET = [...BASE_TOOLS];

export const TOOL_PLAYGROUND_TOOL_SET = [...BASE_TOOLS, ...TOOL_EDITING_TOOLS, "inspect_tool"];

export const SYSTEM_PLAYGROUND_TOOL_SET = [
  "load_skill",
  "find_system",
  "search_documentation",
  "call_system",
  "get_runs",
  ...SYSTEMS_HANDLING_TOOLS,
  "inspect_system",
];

export const ACCESS_RULES_TOOL_SET = [
  "load_skill",
  "find_tool",
  "find_system",
  "search_documentation",
  "inspect_role",
  "find_role",
  "edit_role",
  "test_role_access",
  "find_user",
];
