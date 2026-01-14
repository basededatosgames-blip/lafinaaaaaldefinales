
import { GoogleGenAI, Type } from "@google/genai";
import { AIResponse } from "../types";

// The API key is injected by Vite via the 'define' config
export const getAIClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key not found in environment.");
  return new GoogleGenAI({ apiKey });
};

export const analyzeSketch = async (imageDataBase64: string, prompt: string): Promise<AIResponse> => {
  const ai = getAIClient();
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
          text: `Eres un mentor artístico místico de Nebula Studio. Analiza este boceto. 
          Feedback en español, lúdico y alentador.
          ${prompt}
          Devuelve un objeto JSON con: 
          - critique: una crítica poética corta.
          - suggestion: qué dibujar después para mejorar.
          - palette: 4 códigos hex de colores que combinen con la vibra.
          - backstory: una historia fantástica de 2 frases sobre el dibujo.`
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
          palette: { type: Type.ARRAY, items: { type: Type.STRING } },
          backstory: { type: Type.STRING }
        },
        required: ["critique", "suggestion", "palette", "backstory"]
      }
    }
  });

  const jsonStr = response.text || '{}';
  return JSON.parse(jsonStr.trim());
};

export const generateProVision = async (prompt: string, baseImage?: string): Promise<string> => {
  const ai = getAIClient();
  const contents: any = {
    parts: [
      { text: `High-end digital art masterpiece. Style: Cinematic, ethereal, cosmic, detailed textures. Theme: ${prompt}. Professional illustration.` }
    ]
  };

  if (baseImage) {
    contents.parts.push({
      inlineData: {
        mimeType: 'image/png',
        data: baseImage.split(',')[1]
      }
    });
  }

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents,
    config: {
      imageConfig: {
        aspectRatio: "1:1",
        imageSize: "1K"
      }
    }
  });

  let imageUrl = '';
  if (response.candidates && response.candidates[0].content.parts) {
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        imageUrl = `data:image/png;base64,${part.inlineData.data}`;
        break;
      }
    }
  }
  return imageUrl;
};
