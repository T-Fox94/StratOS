import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

async function deployBranding() {
  const iconSource = path.join(process.cwd(), 'resources', 'ic_launcher.png');
  const splashSource = path.join(process.cwd(), 'resources', 'splash_source.png');
  const androidResPath = path.join(process.cwd(), 'android', 'app', 'src', 'main', 'res');

  if (!fs.existsSync(iconSource) || !fs.existsSync(splashSource)) {
    console.error("Source files missing in /resources. Ensure ic_launcher.png and splash_source.png exist.");
    return;
  }

  // 1. Generate Launcher Icons (Mipmaps)
  const iconSizes = [
    { name: "mipmap-mdpi", size: 48 },
    { name: "mipmap-hdpi", size: 72 },
    { name: "mipmap-xhdpi", size: 96 },
    { name: "mipmap-xxhdpi", size: 144 },
    { name: "mipmap-xxxhdpi", size: 192 },
  ];

  console.log("--- Generating Mipmap Icons ---");
  for (const { name, size } of iconSizes) {
    const dir = path.join(androidResPath, name);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    // Square Icon
    await sharp(iconSource)
      .resize(size, size)
      .toFile(path.join(dir, "ic_launcher.png"));
    
    // Round Icon (using circle mask)
    const circleMask = Buffer.from(`<svg><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" /></svg>`);
    await sharp(iconSource)
      .resize(size, size)
      .composite([{ input: circleMask, blend: "dest-in" }])
      .toFile(path.join(dir, "ic_launcher_round.png"));

    // Foreground Icon (for adaptive icons, we'll use a slightly smaller logo)
    await sharp(iconSource)
      .resize(Math.round(size * 0.7), Math.round(size * 0.7))
      .extend({
        top: Math.round(size * 0.15),
        bottom: Math.round(size * 0.15),
        left: Math.round(size * 0.15),
        right: Math.round(size * 0.15),
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .toFile(path.join(dir, "ic_launcher_foreground.png"));

    console.log(`Generated icons for ${name}`);
  }

  // 2. Generate Splash Screens (Drawables)
  const splashSizes = [
    { name: "drawable-mdpi", w: 320, h: 480 },
    { name: "drawable-hdpi", w: 480, h: 800 },
    { name: "drawable-xhdpi", w: 720, h: 1280 },
    { name: "drawable-xxhdpi", w: 960, h: 1600 },
    { name: "drawable-xxxhdpi", w: 1280, h: 1920 },
  ];

  console.log("\n--- Generating Splash Screens ---");
  for (const { name, w, h } of splashSizes) {
    const dir = path.join(androidResPath, name);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    // Portrait Splash (Logo centered on a dark blue background matching the design)
    const logoSize = Math.round(Math.min(w, h) * 0.4);
    await sharp(splashSource)
      .resize(logoSize, logoSize)
      .extend({
        top: Math.round((h - logoSize) / 2),
        bottom: Math.round((h - logoSize) / 2),
        left: Math.round((w - logoSize) / 2),
        right: Math.round((w - logoSize) / 2),
        background: { r: 3, g: 21, b: 51, alpha: 1 } // Matching dark blue in your design
      })
      .toFile(path.join(dir, "splash.png"));

    console.log(`Generated splash for ${name}`);
  }

  // Main drawable folder fallback
  await sharp(splashSource).resize(512, 512).toFile(path.join(androidResPath, "drawable", "splash.png"));

  console.log("\n✅ Branding deployment complete! All resources are high-quality PNGs.");
}

deployBranding().catch(console.error);
