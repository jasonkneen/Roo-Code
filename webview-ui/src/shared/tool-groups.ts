export type ToolGroup = "read" | "edit" | "browser" | "command" | "mcp"

export const TOOL_GROUPS: Record<ToolGroup, string[]> = {
	read: ["read_file", "search_files", "list_files", "list_code_definition_names"],
	edit: ["write_to_file", "apply_diff"],
	browser: ["browser_action"],
	command: ["execute_command"],
	mcp: ["use_mcp_tool", "access_mcp_resource"],
}

export const ALWAYS_AVAILABLE_TOOLS = ["ask_followup_question", "attempt_completion", "switch_mode"] as const
