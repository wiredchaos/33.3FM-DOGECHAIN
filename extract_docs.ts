import * as fs from 'fs';
import * as path from 'path';
// @ts-ignore
import AdmZip from 'adm-zip';

try {
  const zipPath = path.join(process.cwd(), 'dropbox.zip');
  const destDir = path.join(process.cwd(), 'extracted');

  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir);
  }

  const zip = new AdmZip(zipPath);
  const zipEntries = zip.getEntries();

  zipEntries.forEach((entry: any) => {
    const ext = path.extname(entry.entryName).toLowerCase();
    if (ext === '.md' || ext === '.html' || ext === '.js') {
      const targetPath = path.join(destDir, path.basename(entry.entryName));
      console.log(`Extracting: ${entry.entryName} -> ${targetPath}`);
      fs.writeFileSync(targetPath, entry.getData());
    }
  });

  console.log('Extraction complete.');
} catch (err) {
  console.error('Error extracting zip:', err);
}
