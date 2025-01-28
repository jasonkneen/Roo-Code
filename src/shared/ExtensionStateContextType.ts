export interface ExtensionStateContextType {
	diffEnabled: boolean
	setDiffEnabled: (enabled: boolean) => void
	experimentalDiffStrategy: boolean
	ExtensionStateContextType: string
	setExperimentalDiffStrategy: (strategy: boolean) => void
}
