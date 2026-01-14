
import { GoogleGenAI, Type } from "@google/genai";
import { AIResponse } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const analyzeSketch = async (imageDataBase64: string, prompt: string): Promise<AIResponse> => {
  const model = 'gemini-3-flash-preview';
  
  const response = await ai.models.generateContent({
    model,
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: 'image/png',
            data: imageDataBase64.split(',')[1],
          },
        },
        {
          text: `You are a mystical art mentor from the Nebula Studio. 
          Analyze this sketch. Provide feedback in a playful, encouraging way.
          ${prompt}
          Return a JSON object with: 
          - critique: a short poetic critique.
          - suggestion: what to draw next to make it better.
          - palette: 4 hex color codes that match the vibe.
          - backstory: a 2-sentence whimsical story about what is happening in the drawing.`
        }
      ],
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          critique: { type: Type.STRING },
          suggestion: { type: Type.STRING },
          palette: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING } 
          },
          backstory: { type: Type.STRING }
        },
        required: ["critique", "suggestion", "palette", "backstory"]
      }
    }
  });

  return JSON.parse(response.text || '{}');
};

export const generateVision = async (prompt: string): Promise<string> => {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [{ text: `A magical, ethereal painting based on this description: ${prompt}. High quality, cinematic lighting, nebula atmosphere.` }]
    },
    config: {
      imageConfig: {
        aspectRatio: "1:1"
      }
    }
  });

  let imageUrl = '';
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      imageUrl = `data:image/png;base64,${part.inlineData.data}`;
      break;
    }
  }
  return imageUrl;
};
