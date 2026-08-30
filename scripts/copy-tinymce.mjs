import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const source = path.join(__dirname, '../node_modules/tinymce');
const dest = path.join(__dirname, '../public/tinymce');

try {
  fs.rmSync(dest, { recursive: true, force: true });
  fs.cpSync(source, dest, { recursive: true });
  console.log('Successfully copied tinymce to public folder');
} catch (error) {
  console.error('Error copying tinymce:', error);
  process.exit(1);
}
