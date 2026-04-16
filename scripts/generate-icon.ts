import { GoogleGenAI } from "@google/genai";
import fs from 'fs';
import path from 'path';

async function generateAppIcon() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY is missing.");
    return;
  }
  const ai = new GoogleGenAI({ apiKey });
  const prompt = "A professional, minimalist, and futuristic app icon for 'StratOS'. The design should feature a stylized 'S' integrated with a strategic grid or network pattern. Use a sophisticated color palette of deep navy, electric blue, and silver. High quality, clean lines, suitable for a mobile app icon.";
  
  try {
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

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        const base64Data = part.inlineData.data;
        const buffer = Buffer.from(base64Data, 'base64');
        const iconPath = path.join(process.cwd(), 'public', 'icon.png');
        fs.writeFileSync(iconPath, buffer);
        console.log(`Icon saved to ${iconPath}`);
        return;
      }
    }
  } catch (error) {
    console.error("Error generating icon:", error);
  }
}

generateAppIcon();
