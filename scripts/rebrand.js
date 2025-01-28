const fs = require('fs');
const path = require('path');

const filesToUpdate = [
  'package.json',
  'README.md',
  'CHANGELOG.md',
  '.github/ISSUE_TEMPLATE/config.yml',
  'src/extension.ts',
  'src/api/providers/openrouter.ts',
  'src/api/providers/vscode-lm.ts',
  'src/core/CodeActionProvider.ts',
  'src/integrations/terminal/TerminalRegistry.ts',
  'webview-ui/src/components/chat/Announcement.tsx',
  'webview-ui/src/components/settings/OpenRouterModelPicker.tsx'
];

const replacements = [
  { regex: /Roo Code/g, replacement: 'Synthience Coder' },
  { regex: /Roo Cline/g, replacement: 'Synthience Coder' },
  { regex: /ai\.synthience\.coder/g, replacement: 'coder.synthience.ai' },
  { regex: /RooVeterinaryInc/g, replacement: 'SynthienceInc' },
  { regex: /roo-cline/g, replacement: 'synthience-coder' },
  { regex: /https:\/\/github\.com\/RooVetGit\/Roo-Code/g, replacement: 'https://github.com/SynthienceInc/Synthience-Coder' },
  { regex: /https:\/\/marketplace\.visualstudio\.com\/items\?itemName=RooVeterinaryInc\.roo-cline/g, replacement: 'https://marketplace.visualstudio.com/items?itemName=SynthienceInc.synthience-coder' },
  { regex: /https:\/\/marketplace\.visualstudio\.com\/items\?itemName=RooVeterinaryInc\.roo-cline&ssr=false#review-details/g, replacement: 'https://marketplace.visualstudio.com/items?itemName=SynthienceInc.synthience-coder&ssr=false#review-details' },
  { regex: /https:\/\/github\.com\/RooVetGit\/Roo-Code\/discussions\/categories\/feature-requests/g, replacement: 'https://github.com/SynthienceInc/Synthience-Coder/discussions/categories/feature-requests' }
];

filesToUpdate.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  let fileContent = fs.readFileSync(filePath, 'utf8');

  replacements.forEach(({ regex, replacement }) => {
    fileContent = fileContent.replace(regex, replacement);
  });

  fs.writeFileSync(filePath, fileContent, 'utf8');
});

console.log('Rebranding completed successfully.');
