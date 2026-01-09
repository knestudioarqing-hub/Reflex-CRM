import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateAIResponse = async (prompt: string, context: string): Promise<string> => {
  try {
    const model = 'gemini-3-flash-preview';
    const systemInstruction = `You are an expert BIM (Building Information Modeling) Project Manager assistant for a software called REFLEX CRM. 
    You help users manage architecture and engineering projects. 
    Be concise, professional, and use the user's current context (projects, stats).
    If the user speaks Portuguese, answer in Portuguese. If English, answer in English.
    
    Context Data: ${context}`;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
      }
    });

    return response.text || "I couldn't generate a response at this time.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error connecting to AI service. Please check your API key.";
  }
};