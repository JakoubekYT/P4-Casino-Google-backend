
import { GoogleGenAI, Type } from "@google/genai";

// Always use process.env.API_KEY directly in the named parameter.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Asks Gemini for general advice about CS2 skins.
 */
export const askGeminiAboutSkins = async (userPrompt: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are the OTODROP AI Casino Assistant. The user says: "${userPrompt}". Provide helpful advice about CS2 skins, market trends, or platform features. Keep it short, gaming-themed, and exciting. Use emojis.`,
      config: {
        systemInstruction: "You are a savvy CS2 item trader and platform mascot named Oto. You help users understand skin value and encourage responsible but fun case opening.",
        temperature: 0.8,
        topK: 40,
        topP: 0.9,
      }
    });
    // The response.text property directly returns the string output.
    return response.text || "Oto is thinking... 🧐";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Oto is taking a break! Try again in a moment. 🎮";
  }
};

/**
 * Gets a structured market analysis for a specific skin.
 */
export const getSkinMarketAnalysis = async (skinName: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Provide a 2-sentence market analysis for the CS2 skin: ${skinName}.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            analysis: { type: Type.STRING },
            investmentRating: { type: Type.STRING, description: "One of: LOW, MEDIUM, HIGH, LEGENDARY" },
            funFact: { type: Type.STRING }
          },
          required: ["analysis", "investmentRating", "funFact"]
        }
      }
    });
    // Access response.text and parse the JSON string.
    const jsonStr = response.text?.trim();
    if (!jsonStr) {
      throw new Error("No text returned from Gemini");
    }
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Gemini Market Analysis Error:", error);
    return { 
      analysis: "Price is currently stable in the global market.", 
      investmentRating: "MEDIUM", 
      funFact: "This skin is a community favorite!" 
    };
  }
};
