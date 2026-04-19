import fs from 'fs';
import path from 'path';

async function repairIcons() {
  const androidResPath = path.join(process.cwd(), "android", "app", "src", "main", "res");
  const corruptedPrefix = Buffer.from([0xef, 0xbf, 0xbd]);
  const pngHeader = Buffer.from([0x89, 0x50, 0x4e, 0x47]);

  if (!fs.existsSync(androidResPath)) {
    console.error("Android resource directory not found.");
    return;
  }

  const mipmapDirs = fs.readdirSync(androidResPath).filter(d => d.startsWith("mipmap-"));
  let repairCount = 0;

  for (const dirName of mipmapDirs) {
    const dirPath = path.join(androidResPath, dirName);
    const files = fs.readdirSync(dirPath).filter(f => f.startsWith("ic_launcher") && f.endsWith(".png"));

    for (const fileName of files) {
      const filePath = path.join(dirPath, fileName);
      const buffer = fs.readFileSync(filePath);

      // Check for the corrupted UTF-8 replacement character prefix (ef bf bd)
      if (buffer.slice(0, 3).equals(corruptedPrefix)) {
        console.log(`Detected corruption in ${dirName}/${fileName}. Fixing...`);
        
        // Strip the prefix
        const repairedBuffer = buffer.slice(3);
        
        // Double check if it now starts with a valid PNG header
        if (repairedBuffer.slice(0, 4).equals(pngHeader)) {
          fs.writeFileSync(filePath, repairedBuffer);
          console.log(`Successfully repaired ${dirName}/${fileName}`);
          repairCount++;
        } else {
          console.warn(`Warning: Stripped prefix from ${fileName} but it does not have a valid PNG header.`);
        }
      } else {
        console.log(`${dirName}/${fileName} is already clean or has a different signature. Header: ${buffer.slice(0, 4).toString('hex')}`);
      }
    }
  }

  console.log(`\nRepair complete. Total files repaired: ${repairCount}`);
}

repairIcons().catch(console.error);
