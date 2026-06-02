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

  // Patterns to replace
  // toast.error(err.message || "Something went wrong") -> toast.error(getErrorMessage(err, "Something went wrong"))
  // toast.error(err?.message || "...") -> toast.error(getErrorMessage(err, "..."))
  
  // Replace toast.error(err.message || "...") 
  content = content.replace(/toast\.error\(\s*(?:err|e)\.?\??message\s*\|\|\s*("[^"]+"|'[^']+')\s*\)/g, 'toast.error(getErrorMessage(err, $1))');
  
  // Replace toast.error(err.message)
  content = content.replace(/toast\.error\(\s*(?:err|e)\.?\??message\s*\)/g, 'toast.error(getErrorMessage(err))');

  // Replace setError(err.message || "...")
  content = content.replace(/setError\(\s*(?:err|e)\.?\??message\s*\|\|\s*("[^"]+"|'[^']+')\s*\)/g, 'setError(getErrorMessage(err, $1))');
  
  // Replace setError(err.message)
  content = content.replace(/setError\(\s*(?:err|e)\.?\??message\s*\)/g, 'setError(getErrorMessage(err))');

  // Also catch generic cases like toast.error(error.message || "...")
  content = content.replace(/toast\.error\(\s*error\.?\??message\s*\|\|\s*("[^"]+"|'[^']+')\s*\)/g, 'toast.error(getErrorMessage(error, $1))');
  content = content.replace(/setError\(\s*error\.?\??message\s*\|\|\s*("[^"]+"|'[^']+')\s*\)/g, 'setError(getErrorMessage(error, $1))');

  // Add import if modified and missing
  if (content !== originalContent && !content.includes('getErrorMessage')) {
    const importStatement = `import { getErrorMessage } from "@/lib/error";\n`;
    // Add right after last import
    const lastImportIndex = content.lastIndexOf('import ');
    if (lastImportIndex !== -1) {
      const endOfLine = content.indexOf('\n', lastImportIndex);
      content = content.substring(0, endOfLine + 1) + importStatement + content.substring(endOfLine + 1);
    } else {
      content = importStatement + content;
    }
  }

  // Handle specific edge case where the parameter in catch is named 'e' or 'error' but our replacement used 'err'
  // Actually, we can fix this by capturing the variable name
  let content2 = fs.readFileSync(filePath, 'utf8');
  let originalContent2 = content2;
  
  content2 = content2.replace(/toast\.error\(\s*([a-zA-Z0-9_]+)\.?\??message\s*\|\|\s*("[^"]+"|'[^']+')\s*\)/g, 'toast.error(getErrorMessage($1, $2))');
  content2 = content2.replace(/toast\.error\(\s*([a-zA-Z0-9_]+)\.?\??message\s*\)/g, 'toast.error(getErrorMessage($1))');
  content2 = content2.replace(/setError\(\s*([a-zA-Z0-9_]+)\.?\??message\s*\|\|\s*("[^"]+"|'[^']+')\s*\)/g, 'setError(getErrorMessage($1, $2))');
  content2 = content2.replace(/setError\(\s*([a-zA-Z0-9_]+)\.?\??message\s*\)/g, 'setError(getErrorMessage($1))');

  // Check if we need to add import again
  if (content2 !== originalContent2) {
    if (!content2.includes('getErrorMessage')) {
      const importStatement = `import { getErrorMessage } from "@/lib/error";\n`;
      const lastImportIndex = content2.lastIndexOf('import ');
      if (lastImportIndex !== -1) {
        const endOfLine = content2.indexOf('\n', lastImportIndex);
        content2 = content2.substring(0, endOfLine + 1) + importStatement + content2.substring(endOfLine + 1);
      } else {
        content2 = importStatement + content2;
      }
    }
    fs.writeFileSync(filePath, content2, 'utf8');
    console.log(`Updated ${filePath}`);
  }
}

for (const dir of dirs) {
  processDirectory(path.join(baseDir, dir));
}

console.log('Done!');
