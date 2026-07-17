import * as https from 'https';
import * as fs from 'fs';
import * as path from 'path';

const url = 'https://www.dropbox.com/scl/fo/fzz00c29mhweh10aea7fk/AGzTFogieaWjEMApD4U3dI8?rlkey=th6sfw5simavdxt8qo53krkxy&st=j2t9m7vw&dl=1';
const dest = path.join(process.cwd(), 'dropbox.zip');

function download(urlStr: string, destPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    https.get(urlStr, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        // Follow redirect
        const redirectUrl = response.headers.location;
        if (redirectUrl) {
          console.log(`Redirecting to: ${redirectUrl}`);
          download(redirectUrl, destPath).then(resolve).catch(reject);
          return;
        }
      }

      if (response.statusCode !== 200) {
        reject(new Error(`Failed to get '${urlStr}' (Status Code: ${response.statusCode})`));
        return;
      }

      const file = fs.createWriteStream(destPath);
      response.pipe(file);

      file.on('finish', () => {
        file.close();
        console.log('Download completed successfully.');
        resolve();
      });

      file.on('error', (err) => {
        fs.unlink(destPath, () => {}); // Delete the file async if there's an error
        reject(err);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

download(url, dest)
  .then(() => {
    const stats = fs.statSync(dest);
    console.log(`Zip size: ${stats.size} bytes`);
  })
  .catch((err) => {
    console.error('Error downloading:', err);
  });
