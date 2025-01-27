import { ToolGroup } from "./tool-groups"

export type Mode = string

export type GroupOptions = {
	fileRegex?: string
	description?: string
}

export type GroupEntry = ToolGroup | readonly [ToolGroup, GroupOptions]

export type ModeConfig = {
	slug: string
	name: string
	roleDefinition: string
	customInstructions?: string
	groups: readonly GroupEntry[]
}

export type PromptComponent = {
	roleDefinition?: string
	customInstructions?: string
}

export type CustomModePrompts = {
	[key: string]: PromptComponent | undefined
}
