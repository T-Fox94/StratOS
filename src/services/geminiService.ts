import { GoogleGenAI, Modality, Type, FunctionDeclaration } from "@google/genai";
import { db } from "../firebase";
import { doc, getDoc, updateDoc, addDoc, collection, deleteDoc, serverTimestamp } from "firebase/firestore";

let sharedAudioContext: AudioContext | null = null;

function getAudioContext() {
  if (!sharedAudioContext) {
    sharedAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  }
  return sharedAudioContext;
}

// Tool definitions
const getClientDetailsTool: FunctionDeclaration = {
  name: "getClientDetails",
  description: "Get the current details for a specific client by their ID.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      clientId: {
        type: Type.STRING,
        description: "The unique ID of the client.",
      },
    },
    required: ["clientId"],
  },
};

const updateClientDetailsTool: FunctionDeclaration = {
  name: "updateClientDetails",
  description: "Update specific details for a client. Only provide the fields that need to be changed.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      clientId: {
        type: Type.STRING,
        description: "The unique ID of the client.",
      },
      updates: {
        type: Type.OBJECT,
        description: "The fields to update (e.g., name, industry, toneOfVoice, visualStyle).",
        properties: {
          name: { type: Type.STRING },
          industry: { type: Type.STRING },
          status: { type: Type.STRING, enum: ["active", "paused", "lead"] },
          toneOfVoice: { type: Type.STRING },
          visualStyle: { type: Type.STRING },
          website: { type: Type.STRING },
          brandColors: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
      },
    },
    required: ["clientId", "updates"],
  },
};

const addClientTool: FunctionDeclaration = {
  name: "addClient",
  description: "Add a new client to the database.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      clientData: {
        type: Type.OBJECT,
        description: "The details of the new client.",
        properties: {
          name: { type: Type.STRING },
          industry: { type: Type.STRING },
          status: { type: Type.STRING, enum: ["active", "paused", "lead"] },
          toneOfVoice: { type: Type.STRING },
          visualStyle: { type: Type.STRING },
          website: { type: Type.STRING },
          brandColors: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ["name", "industry", "status"],
      },
    },
    required: ["clientData"],
  },
};

const deleteClientTool: FunctionDeclaration = {
  name: "deleteClient",
  description: "Remove a client from the database by their ID.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      clientId: {
        type: Type.STRING,
        description: "The unique ID of the client to delete.",
      },
    },
    required: ["clientId"],
  },
};

// Tool implementations
async function getClientDetails(clientId: string) {
  try {
    const clientDoc = await getDoc(doc(db, "clients", clientId));
    if (clientDoc.exists()) {
      return clientDoc.data();
    }
    return { error: "Client not found" };
  } catch (error) {
    console.error("Error fetching client details:", error);
    return { error: "Failed to fetch client details" };
  }
}

async function updateClientDetails(clientId: string, updates: any) {
  try {
    await updateDoc(doc(db, "clients", clientId), updates);
    return { success: true, message: `Successfully updated details for client ${clientId}` };
  } catch (error) {
    console.error("Error updating client details:", error);
    return { error: "Failed to update client details. Ensure you have the correct permissions." };
  }
}

async function addClient(clientData: any) {
  try {
    const docRef = await addDoc(collection(db, "clients"), {
      ...clientData,
      createdAt: serverTimestamp(),
      currentMonthUsage: 0,
      monthlyQuota: 10, // Default quota
      riskLevel: "low",
    });
    return { success: true, message: `Successfully added new client with ID: ${docRef.id}`, clientId: docRef.id };
  } catch (error) {
    console.error("Error adding client:", error);
    return { error: "Failed to add client. Ensure you have the correct permissions." };
  }
}

async function deleteClient(clientId: string) {
  try {
    await deleteDoc(doc(db, "clients", clientId));
    return { success: true, message: `Successfully deleted client ${clientId}` };
  } catch (error) {
    console.error("Error deleting client:", error);
    return { error: "Failed to delete client. Ensure you have the correct permissions." };
  }
}

export function initAudio() {
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') {
    ctx.resume();
  }
  return ctx;
}

export async function generateAICaption(clientName: string, tone: string, visualStyle: string) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate a natural, engaging social media caption for a client named "${clientName}". 
      Tone: ${tone}. 
      Visual Style: ${visualStyle}. 
      The response should be nicely paragraphed and include relevant hashtags. 
      Avoid corporate jargon. Make it feel human and authentic.`,
    });
    return response.text || "";
  } catch (error) {
    console.error("Error generating AI caption:", error);
    return "Error generating caption. Please try again.";
  }
}

export async function analyzePostSentiment(postTitle: string, caption: string, platform: string) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze the following social media post for "${platform}". 
      Title: ${postTitle}
      Caption: ${caption}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            sentiment: {
              type: Type.STRING,
              description: "Overall sentiment of the post (e.g., Positive, Neutral, Negative)",
            },
            brandRisk: {
              type: Type.STRING,
              description: "Risk level (Low, Medium, High)",
            },
            analysis: {
              type: Type.STRING,
              description: "Detailed analysis of the post's impact and potential issues.",
            },
            recommendations: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of recommendations to improve the post or mitigate risk.",
            }
          },
          required: ["sentiment", "brandRisk", "analysis", "recommendations"]
        }
      }
    });
    
    if (response.text) {
      return JSON.parse(response.text);
    }
    throw new Error("Empty response from AI");
  } catch (error) {
    console.error("Error analyzing post sentiment:", error);
    return {
      sentiment: "Unknown",
      brandRisk: "Unknown",
      analysis: "Error analyzing post. Please try again.",
      recommendations: []
    };
  }
}

export async function getChatResponse(message: string, context: string) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  try {
    const systemInstruction = "You are StratOS AI, a helpful social media agency assistant. You can view, add, edit, and remove client details if requested. When performing destructive actions like deleting, always confirm with the user first. Your responses should be natural, nicely paragraphed, and professional yet friendly. Avoid corporate jargon.";
    const tools = [{ functionDeclarations: [getClientDetailsTool, updateClientDetailsTool, addClientTool, deleteClientTool] }];

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Context: ${context}\n\nUser: ${message}`,
      config: {
        systemInstruction,
        tools,
      }
    });

    // Handle function calls
    const functionCalls = response.functionCalls;
    if (functionCalls) {
      const results = [];
      for (const call of functionCalls) {
        if (call.name === "getClientDetails") {
          const result = await getClientDetails(call.args.clientId as string);
          results.push({ name: call.name, response: { content: result }, id: call.id });
        } else if (call.name === "updateClientDetails") {
          const result = await updateClientDetails(call.args.clientId as string, call.args.updates);
          results.push({ name: call.name, response: { content: result }, id: call.id });
        } else if (call.name === "addClient") {
          const result = await addClient(call.args.clientData);
          results.push({ name: call.name, response: { content: result }, id: call.id });
        } else if (call.name === "deleteClient") {
          const result = await deleteClient(call.args.clientId as string);
          results.push({ name: call.name, response: { content: result }, id: call.id });
        }
      }

      // Send results back to model
      const secondResponse = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          { role: 'user', parts: [{ text: `Context: ${context}\n\nUser: ${message}` }] },
          response.candidates[0].content,
          { parts: results.map(r => ({ functionResponse: r })) }
        ],
        config: {
          systemInstruction,
          tools,
        }
      });
      return secondResponse.text || "I've processed your request.";
    }

    return response.text || "I'm sorry, I couldn't process that.";
  } catch (error) {
    console.error("Error getting chat response:", error);
    return "Error communicating with AI. Please check your connection.";
  }
}

export async function* getChatResponseStream(message: string, context: string) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  try {
    // For simplicity in streaming, we'll first check if a tool call is needed
    // In a real app, you'd handle tool calls within the stream, but for now we'll use the non-stream version if tools are likely
    // Or just implement the stream without tools for now as it's more complex to mix
    const response = await ai.models.generateContentStream({
      model: "gemini-3-flash-preview",
      contents: `Context: ${context}\n\nUser: ${message}`,
      config: {
        systemInstruction: "You are StratOS AI, a helpful social media agency assistant. Your responses should be natural, nicely paragraphed, and professional yet friendly. Avoid corporate jargon.",
      }
    });

    for await (const chunk of response) {
      if (chunk.text) {
        yield chunk.text;
      }
    }
  } catch (error) {
    console.error("Error getting chat response stream:", error);
    yield "Error communicating with AI. Please check your connection.";
  }
}

export async function analyzeIdea(message: string, files: { data: string, mimeType: string }[]) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  try {
    const parts = [
      { text: message },
      ...files.map(file => ({
        inlineData: {
          data: file.data.split(',')[1], // Remove data:image/png;base64,
          mimeType: file.mimeType
        }
      }))
    ];

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: { parts },
      config: {
        systemInstruction: "You are StratOS Creative Lab Assistant. You help social media managers refine their ideas. Analyze the provided text and images/documents. Provide creative feedback, potential post ideas, and strategic advice. Be encouraging and professional.",
      }
    });
    return response.text || "I've analyzed your input but couldn't generate a response.";
  } catch (error) {
    console.error("Error analyzing idea:", error);
    return "Error analyzing your idea. Please try again.";
  }
}

export async function speakText(text: string) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' }, // 'Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      const audioContext = getAudioContext();
      
      // Decode base64 to ArrayBuffer
      const binaryString = window.atob(base64Audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      // Convert 16-bit PCM to Float32
      const pcmData = new Int16Array(bytes.buffer);
      const float32Data = new Float32Array(pcmData.length);
      for (let i = 0; i < pcmData.length; i++) {
        float32Data[i] = pcmData[i] / 32768.0;
      }

      const audioBuffer = audioContext.createBuffer(1, float32Data.length, 24000);
      audioBuffer.getChannelData(0).set(float32Data);

      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      
      source.start();
      return new Promise((resolve) => {
        source.onended = resolve;
      });
    }
  } catch (error) {
    console.error("Error generating speech:", error);
  }
}

export async function generateAIImage(prompt: string) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-image-preview',
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
          imageSize: "1K"
        }
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image data in response");
  } catch (error) {
    console.error("Error generating AI image:", error);
    throw error;
  }
}
