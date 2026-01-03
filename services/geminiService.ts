
import { GoogleGenAI, Type } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";
import { Role, ChatMessage, MessagePart } from "../types";

const createClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

export const generateSpeech = async (text: string): Promise<string | null> => {
  try {
    const ai = createClient();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Read this clearly like a professional teacher: ${text}` }] }],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
  } catch (error) {
    console.error("Speech Generation Error:", error);
    return null;
  }
};

export const generateVisualAid = async (prompt: string): Promise<{ mimeType: string; data: string } | null> => {
  try {
    const ai = createClient();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: `A clean, academic-style educational diagram or illustration for a school textbook: ${prompt}. No realistic photos of people, focus on the scientific or educational concept. White background.` }],
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1"
        }
      }
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData?.data) {
        return {
          mimeType: part.inlineData.mimeType,
          data: part.inlineData.data
        };
      }
    }
    return null;
  } catch (error) {
    console.error("Image Generation Error:", error);
    return null;
  }
};

export const generateStudyResponse = async (
  prompt: string, 
  history: ChatMessage[],
  imagePart?: MessagePart
): Promise<{ text: string; visualPrompt?: string }> => {
  try {
    const ai = createClient();
    
    // Rigorous filtering of history parts to avoid INVALID_ARGUMENT
    const recentHistory = history.slice(-10).map(msg => ({
      role: msg.role === Role.USER ? 'user' as const : 'model' as const,
      parts: msg.parts.map(p => {
        if (p.text && p.text.trim().length > 0) return { text: p.text };
        if (p.inlineData?.data && p.inlineData?.mimeType) return { inlineData: p.inlineData };
        if (p.generatedImage?.data && p.generatedImage?.mimeType) return { inlineData: p.generatedImage };
        return null;
      }).filter((p): p is any => p !== null)
    })).filter(msg => msg.parts.length > 0);

    const currentParts: any[] = [];
    if (imagePart?.inlineData?.data && imagePart?.inlineData?.mimeType) {
      currentParts.push({ inlineData: imagePart.inlineData });
    }
    if (prompt && prompt.trim().length > 0) {
      currentParts.push({ text: prompt });
    }

    if (currentParts.length === 0) {
        throw new Error("No valid content to send");
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: [
        ...recentHistory,
        { role: 'user', parts: currentParts }
      ],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.1,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            finalAnswer: { type: Type.STRING },
            conceptContent: { type: Type.STRING },
            hasConcept: { type: Type.BOOLEAN },
            visualPrompt: { type: Type.STRING }
          },
          required: ["finalAnswer", "conceptContent", "hasConcept"]
        }
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    return {
      text: response.text || "",
      visualPrompt: parsed.visualPrompt
    };
  } catch (error) {
    console.error("Gemini API Error:", error);
    if (error instanceof Error && (error.message.includes("403") || error.message.includes("blocked"))) {
        return {
          text: JSON.stringify({
            finalAnswer: "This AI is designed only for study-related questions.",
            conceptContent: "",
            hasConcept: false
          })
        };
    }
    throw error;
  }
};
