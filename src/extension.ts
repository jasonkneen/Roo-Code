import delay from "delay"
import * as vscode from "vscode"
import { ClineProvider } from "./core/webview/ClineProvider"
import { createClineAPI } from "./exports"
import "./utils/path"
import { ACTION_NAMES, CodeActionProvider } from "./core/CodeActionProvider"
import { DIFF_VIEW_URI_SCHEME } from "./integrations/editor/DiffViewProvider"

let outputChannel: vscode.OutputChannel

export function activate(context: vscode.ExtensionContext) {
	outputChannel = vscode.window.createOutputChannel("Synthience-Coder")
	context.subscriptions.push(outputChannel)

	outputChannel.appendLine("Synthience-Coder extension activated")

	const defaultCommands = vscode.workspace.getConfiguration("roo-cline").get<string[]>("allowedCommands") || []

	if (!context.globalState.get("allowedCommands")) {
		context.globalState.update("allowedCommands", defaultCommands)
	}

	const sidebarProvider = new ClineProvider(context, outputChannel)

	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(ClineProvider.sideBarId, sidebarProvider, {
			webviewOptions: { retainContextWhenHidden: true },
		}),
	)

	context.subscriptions.push(
		vscode.commands.registerCommand("roo-cline.plusButtonClicked", async () => {
			outputChannel.appendLine("Plus button Clicked")
			await sidebarProvider.clearTask()
			await sidebarProvider.postStateToWebview()
			await sidebarProvider.postMessageToWebview({ type: "action", action: "chatButtonClicked" })
		}),
	)

	context.subscriptions.push(
		vscode.commands.registerCommand("roo-cline.mcpButtonClicked", () => {
			sidebarProvider.postMessageToWebview({ type: "action", action: "mcpButtonClicked" })
		}),
	)

	context.subscriptions.push(
		vscode.commands.registerCommand("roo-cline.promptsButtonClicked", () => {
			sidebarProvider.postMessageToWebview({ type: "action", action: "promptsButtonClicked" })
		}),
	)

	const openClineInNewTab = async () => {
		outputChannel.appendLine("Opening Synthience Coder in new tab")
		const tabProvider = new ClineProvider(context, outputChannel)
		const lastCol = Math.max(...vscode.window.visibleTextEditors.map((editor) => editor.viewColumn || 0))

		const hasVisibleEditors = vscode.window.visibleTextEditors.length > 0
		if (!hasVisibleEditors) {
			await vscode.commands.executeCommand("workbench.action.newGroupRight")
			await delay(100)
		}
		const targetCol = hasVisibleEditors ? Math.max(lastCol + 1, 1) : vscode.ViewColumn.Two

		const panel = vscode.window.createWebviewPanel(ClineProvider.tabPanelId, "Synthience Coder", targetCol, {
			enableScripts: true,
			retainContextWhenHidden: true,
			localResourceRoots: [context.extensionUri],
		})

		panel.iconPath = {
			light: vscode.Uri.joinPath(context.extensionUri, "assets", "icons", "rocket.png"),
			dark: vscode.Uri.joinPath(context.extensionUri, "assets", "icons", "rocket.png"),
		}
		tabProvider.resolveWebviewView(panel)

		await delay(100)
		await vscode.commands.executeCommand("workbench.action.lockEditorGroup")
	}

	context.subscriptions.push(vscode.commands.registerCommand("roo-cline.popoutButtonClicked", openClineInNewTab))
	context.subscriptions.push(vscode.commands.registerCommand("roo-cline.openInNewTab", openClineInNewTab))

	context.subscriptions.push(
		vscode.commands.registerCommand("roo-cline.settingsButtonClicked", () => {
			sidebarProvider.postMessageToWebview({ type: "action", action: "settingsButtonClicked" })
		}),
	)

	context.subscriptions.push(
		vscode.commands.registerCommand("roo-cline.historyButtonClicked", () => {
			sidebarProvider.postMessageToWebview({ type: "action", action: "historyButtonClicked" })
		}),
	)

	const diffContentProvider = new (class implements vscode.TextDocumentContentProvider {
		provideTextDocumentContent(uri: vscode.Uri): string {
			return Buffer.from(uri.query, "base64").toString("utf-8")
		}
	})()
	context.subscriptions.push(
		vscode.workspace.registerTextDocumentContentProvider(DIFF_VIEW_URI_SCHEME, diffContentProvider),
	)

	const handleUri = async (uri: vscode.Uri) => {
		const path = uri.path
		const query = new URLSearchParams(uri.query.replace(/\+/g, "%2B"))
		const visibleProvider = ClineProvider.getVisibleInstance()
		if (!visibleProvider) {
			return
		}
		switch (path) {
			case "/glama": {
				const code = query.get("code")
				if (code) {
					await visibleProvider.handleGlamaCallback(code)
				}
				break
			}

			case "/openrouter": {
				const code = query.get("code")
				if (code) {
					await visibleProvider.handleOpenRouterCallback(code)
				}
				break
			}
			default:
				break
		}
	}
	context.subscriptions.push(vscode.window.registerUriHandler({ handleUri }))

	context.subscriptions.push(
		vscode.languages.registerCodeActionsProvider({ pattern: "**/*" }, new CodeActionProvider(), {
			providedCodeActionKinds: CodeActionProvider.providedCodeActionKinds,
		}),
	)

	const registerCodeAction = (
		context: vscode.ExtensionContext,
		command: string,
		promptType: keyof typeof ACTION_NAMES,
		inputPrompt?: string,
		inputPlaceholder?: string,
	) => {
		let userInput: string | undefined

		context.subscriptions.push(
			vscode.commands.registerCommand(
				command,
				async (filePath: string, selectedText: string, diagnostics?: any[]) => {
					if (inputPrompt) {
						userInput = await vscode.window.showInputBox({
							prompt: inputPrompt,
							placeHolder: inputPlaceholder,
						})
					}

					const params = {
						filePath,
						selectedText,
						...(diagnostics ? { diagnostics } : {}),
						...(userInput ? { userInput } : {}),
					}

					await ClineProvider.handleCodeAction(command, promptType, params)
				},
			),
		)
	}

	registerCodeAction(
		context,
		"roo-cline.explainCode",
		"EXPLAIN",
		"What would you like Synthience Coder to explain?",
		"E.g. How does the error handling work?",
	)

	registerCodeAction(
		context,
		"roo-cline.fixCode",
		"FIX",
		"What would you like Synthience Coder to fix?",
		"E.g. Maintain backward compatibility",
	)

	registerCodeAction(
		context,
		"roo-cline.fixCodeInCurrentTask",
		"FIX", // keep this for use the same prompt with FIX command
		"What would you like Roo to fix?",
		"E.g. Maintain backward compatibility",
	)

	registerCodeAction(
		context,
		"roo-cline.improveCode",
		"IMPROVE",
		"What would you like Synthience Coder to improve?",
		"E.g. Focus on performance optimization",
	)

	return createClineAPI(outputChannel, sidebarProvider)
}

export function deactivate() {
	outputChannel.appendLine("Synthience-Coder extension deactivated")
}
