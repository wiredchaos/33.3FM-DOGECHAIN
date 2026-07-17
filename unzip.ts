import * as fs from 'fs';
import * as path from 'path';
// @ts-ignore
import AdmZip from 'adm-zip';

try {
  const zipPath = path.join(process.cwd(), 'dropbox.zip');
  if (!fs.existsSync(zipPath)) {
    console.error('dropbox.zip does not exist!');
    process.exit(1);
  }

  const stats = fs.statSync(zipPath);
  console.log(`Zip file size: ${stats.size} bytes`);

  const zip = new AdmZip(zipPath);
  const zipEntries = zip.getEntries();

  console.log(`Total entries: ${zipEntries.length}`);
  zipEntries.forEach((entry: any) => {
    console.log(`- ${entry.entryName} (isDir: ${entry.isDirectory}, size: ${entry.header.size})`);
  });
} catch (err) {
  console.error('Error reading zip:', err);
}
