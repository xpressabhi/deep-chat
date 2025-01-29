// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const ollama = require('ollama').default;

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "deep-chat" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand(
		'deep-chat.start',
		function () {
			// The code you place here will be executed every time your command is executed

			// Display a message box to the user
			const panel = vscode.window.createWebviewPanel(
				'deepChat',
				'Deep Seek Chat',
				vscode.ViewColumn.One,
				{ enableScripts: true },
			);
			panel.webview.html = getWebviewContent();
			panel.webview.onDidReceiveMessage(async (message) => {
				if (message.command === 'chat') {
					const userPrompt = message.question;
					let responseText = '';

					try {
						const streamResponse = await ollama.chat({
							model: 'deepseek-r1:14b',
							messages: [{ role: 'user', content: userPrompt }],
							stream: true,
						});
						for await (const response of streamResponse) {
							console.log(response);
							responseText += response.message.content;
							panel.webview.postMessage({
								command: 'chatResponse',
								answer: responseText,
							});
						}
					} catch (error) {
						panel.webview.postMessage({
							command: 'chatResponse',
							answer: 'Error: ' + error.message,
						});
					}
				}
			});
		},
	);

	context.subscriptions.push(disposable);
}

function getWebviewContent() {
	return /*html*/ `
	<!DOCTYPE html>
	<html lang="en">
	<head>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<title>Deep Seek Chat</title>
		<style>
		body {font-family: Arial, sans-serif; margin:1rem;}
		#prompt {width: 500px, box-sizing: border-box; padding: 0.5rem; margin-bottom: 1rem;}
		#response {border: 1px solid #ccc; margin-top:1rem; padding: 0.5rem; border-radius: 0.5rem; height:500px; overflow-y: auto; color: white;}
		</style>
	</head>
	<body>
	<h2>Deep VS Code Extension</h2>
	<textarea id="prompt" rows="3" placeholder="Ask something...."></textarea> <br />
	<button id="askBtn">Ask</button>
	<div id="response"></div>
	<script>
		const vscode = acquireVsCodeApi();
		const prompt = document.getElementById('prompt');
		const response = document.getElementById('response');
		const askBtn = document.getElementById('askBtn');
		askBtn.addEventListener('click', () => {
			const question = prompt.value;
			response.innerHTML = 'Thinking...';
			vscode.postMessage({ command:'chat', question });
		});
		window.addEventListener('message', event => {
			const {command , answer} = event.data;
			if(command === 'chatResponse'){
				response.innerHTML = answer;
			}
		});

	</script>
	</body>
	</html>`;
}

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate,
};
