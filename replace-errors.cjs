const fs = require('fs');
const path = require('path');

const baseDir = '/Users/neshmapatel/Desktop/Upal Projects/stock_inventory/stock-front/app';
const dirs = [
  'billing', 'audit-logs', 'categories', 'expenses', 'invite', 
  'login', 'outlets', 'products', 'reports', 'roles', 
  'settings', 'staff', 'stock', 'subscribe', 'units'
];

function processDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) return;
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      processDirectory(fullPath);
    } else if (entry.isFile() && (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts'))) {
      processFile(fullPath);
    }
  }
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // 1. replace err.message || "..." with getErrorMessage(err, "...")
  content = content.replace(/toast\.error\(\s*([a-zA-Z0-9_]+)\.?\??message\s*\|\|\s*("[^"]+"|'[^']+')\s*\)/g, 'toast.error(getErrorMessage($1, $2))');
  content = content.replace(/setError\(\s*([a-zA-Z0-9_]+)\.?\??message\s*\|\|\s*("[^"]+"|'[^']+')\s*\)/g, 'setError(getErrorMessage($1, $2))');

  // 2. replace err.message with getErrorMessage(err)
  content = content.replace(/toast\.error\(\s*([a-zA-Z0-9_]+)\.?\??message\s*\)/g, 'toast.error(getErrorMessage($1))');
  content = content.replace(/setError\(\s*([a-zA-Z0-9_]+)\.?\??message\s*\)/g, 'setError(getErrorMessage($1))');
  
  // check if modified
  if (content !== originalContent) {
    if (!content.includes('getErrorMessage')) {
      const importStatement = `import { getErrorMessage } from "@/lib/error";\n`;
      const lastImportIndex = content.lastIndexOf('import ');
      if (lastImportIndex !== -1) {
        const endOfLine = content.indexOf('\n', lastImportIndex);
        content = content.substring(0, endOfLine + 1) + importStatement + content.substring(endOfLine + 1);
      } else {
        content = importStatement + content;
      }
    }
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
  }
}

for (const dir of dirs) {
  processDirectory(path.join(baseDir, dir));
}

console.log('Done!');
