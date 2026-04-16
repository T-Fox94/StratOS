import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";
import sharp from "sharp";

export async function generateAndSaveAppIcon() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    console.error("Neither GEMINI_API_KEY nor API_KEY is set in the environment.");
    return;
  }

  const ai = new GoogleGenAI({ apiKey });
  const prompt = "A professional, minimalist, and futuristic app icon for 'StratOS'. The design should feature a stylized 'S' integrated with a strategic grid or network pattern. Use a sophisticated color palette of deep navy, electric blue, and silver. High quality, clean lines, suitable for a mobile app icon.";
  
  console.log("Generating icon with Gemini...");
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          text: prompt,
        },
      ],
    },
    config: {
      imageConfig: {
        aspectRatio: "1:1",
      },
    },
  });

  let base64Data: string | undefined;
  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      base64Data = part.inlineData.data;
      break;
    }
  }

  if (!base64Data) {
    console.error("No image data returned from Gemini.");
    return;
  }

  const buffer = Buffer.from(base64Data, "base64");

  // Save to public folder for web
  const publicPath = path.join(process.cwd(), "public", "icon.png");
  if (!fs.existsSync(path.join(process.cwd(), "public"))) {
    fs.mkdirSync(path.join(process.cwd(), "public"), { recursive: true });
  }
  fs.writeFileSync(publicPath, buffer);
  console.log(`Saved web icon to ${publicPath}`);

  // Android resource paths and sizes
  const androidResPath = path.join(process.cwd(), "android", "app", "src", "main", "res");
  const sizes = [
    { name: "mipmap-mdpi", size: 48 },
    { name: "mipmap-hdpi", size: 72 },
    { name: "mipmap-xhdpi", size: 96 },
    { name: "mipmap-xxhdpi", size: 144 },
    { name: "mipmap-xxxhdpi", size: 192 },
  ];

  if (fs.existsSync(androidResPath)) {
    for (const { name, size } of sizes) {
      const dir = path.join(androidResPath, name);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const iconPath = path.join(dir, "ic_launcher.png");
      const roundIconPath = path.join(dir, "ic_launcher_round.png");

      // Square icon
      await sharp(buffer)
        .resize(size, size)
        .toFile(iconPath);
      
      // Round icon (using a circle mask)
      const circleMask = Buffer.from(
        `<svg><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" /></svg>`
      );
      await sharp(buffer)
        .resize(size, size)
        .composite([{ input: circleMask, blend: "dest-in" }])
        .toFile(roundIconPath);

      console.log(`Saved Android icons to ${dir}`);
    }
  } else {
    console.warn("Android resource directory not found. Skipping Android icon generation.");
  }

  console.log("App icon generation and organization complete.");
}

// Execute if run directly
if (import.meta.url.endsWith(process.argv[1])) {
  generateAndSaveAppIcon().catch(console.error);
}
