import fs from 'node:fs/promises';
import { pdf } from 'pdf-to-img';
import sharp from 'sharp';

const source = 'C:/Users/Administrator/Downloads/Logo.pdf';
const document = await pdf(source, { scale: 4 });

for await (const image of document) {
  await fs.writeFile('public/velaivaaipu-logo-source.png', image);
  const sourceImage = sharp(image);
  const { data, info } = await sourceImage.ensureAlpha().raw().toBuffer({ resolveWithObject: true });

  // Remove the white PDF page while retaining anti-aliased brand edges.
  for (let offset = 0; offset < data.length; offset += 4) {
    const red = data[offset];
    const green = data[offset + 1];
    const blue = data[offset + 2];
    const lowestChannel = Math.min(red, green, blue);
    if (lowestChannel >= 238) {
      data[offset + 3] = Math.round(255 * (255 - lowestChannel) / 17);
    }
  }

  await sharp(data, { raw: info })
    .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .resize({ width: 1000, withoutEnlargement: true })
    .png({ compressionLevel: 9 })
    .toFile('public/velaivaaipu-logo.png');

  // Crop the symbol from the normalized full lockup for compact/favicon use.
  await sharp('public/velaivaaipu-logo.png')
    .extract({ left: 100, top: 0, width: 790, height: 405 })
    .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .resize({ width: 512, withoutEnlargement: true })
    .png({ compressionLevel: 9 })
    .toFile('public/velaivaaipu-mark.png');
  break;
}

console.log('Created source, full logo, and compact mark assets in public/');
