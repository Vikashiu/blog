
import { GoogleGenAI, Type, Modality } from "@google/genai";

// Models
const TEXT_MODEL = 'gemini-3-flash-preview';
const COMPLEX_TEXT_MODEL = 'gemini-3-pro-preview';
const IMAGE_GEN_MODEL = 'gemini-3-pro-image-preview';
const AUDIO_MODEL = 'gemini-3-flash-preview';
const TTS_MODEL = 'gemini-2.5-flash-preview-tts';

// --- Text & Chat ---

export const generateBlogDraft = async (title: string, instructions: string): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `
      You are an expert blog post writer. Write a comprehensive, engaging, and well-structured blog post.
      Title: "${title}"
      Instructions: "${instructions}"
      Format: Clean HTML (h1, h2, p, ul, ol, blockquote). No markdown code blocks.
    `;
    const response = await ai.models.generateContent({
      model: COMPLEX_TEXT_MODEL,
      contents: prompt,
    });
    return response.text || "";
  } catch (error) {
    console.error("Draft Error:", error);
    throw error;
  }
};

export const improveContent = async (content: string, instruction?: string): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `
      Act as a professional editor. 
      Task: ${instruction || "Improve grammar, clarity, and flow."}
      Content: ${content}
      Output: Return ONLY the updated HTML content.
    `;
    const response = await ai.models.generateContent({
      model: COMPLEX_TEXT_MODEL,
      contents: prompt,
    });
    return response.text || content;
  } catch (error) {
    console.error("Improvement Error:", error);
    throw error;
  }
};

export const generateTitle = async (content: string): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `
      Read the following blog post content and generate a single, catchy, SEO-optimized title for it. 
      Return ONLY the title text, no quotes.
      
      Content Snippet:
      ${content.substring(0, 2000)}
    `;
    const response = await ai.models.generateContent({
      model: TEXT_MODEL,
      contents: prompt,
    });
    return response.text?.trim() || "";
  } catch (error) {
    console.error("Title Gen Error:", error);
    throw error;
  }
};

export const chatWithGemini = async (history: {role: string, parts: {text: string}[]}[], message: string) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const chat = ai.chats.create({
      model: COMPLEX_TEXT_MODEL,
      history: history,
    });
    const response = await chat.sendMessage({ message });
    return response.text;
  } catch (error) {
    console.error("Chat Error:", error);
    throw error;
  }
};

export const generateMetadata = async (content: string): Promise<{ summary: string; tags: string[] }> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: TEXT_MODEL,
      contents: `Analyze this content and return JSON with a 'summary' (2 sentences) and 'tags' (5 keywords).\n\n${content.substring(0, 3000)}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
        },
      },
    });
    return JSON.parse(response.text || '{"summary":"", "tags":[]}');
  } catch (error) {
    console.error("Metadata Error:", error);
    return { summary: "Analysis failed", tags: ["General"] };
  }
};

// --- Vision ---

export const analyzeImage = async (base64Image: string, prompt: string): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: COMPLEX_TEXT_MODEL,
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
          { text: prompt || "Describe this image in detail." }
        ]
      }
    });
    return response.text || "No analysis available.";
  } catch (error) {
    console.error("Vision Error:", error);
    throw error;
  }
};

// --- Image Generation ---

export const generateImage = async (prompt: string, aspectRatio: string = "1:1"): Promise<string> => {
  try {
    // Check for API key selection for pro models if required
    if ((window as any).aistudio && typeof (window as any).aistudio.hasSelectedApiKey === 'function') {
        const hasKey = await (window as any).aistudio.hasSelectedApiKey();
        if (!hasKey) {
             throw new Error("API_KEY_REQUIRED");
        }
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: IMAGE_GEN_MODEL,
      contents: { parts: [{ text: prompt }] },
      config: {
        imageConfig: { aspectRatio: aspectRatio as any }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image generated");
  } catch (error) {
    console.error("Image Gen Error:", error);
    throw error;
  }
};

// --- Audio & Speech ---

export const transcribeAudio = async (audioBase64: string, mimeType: string): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: AUDIO_MODEL,
      contents: {
        parts: [
          { inlineData: { mimeType, data: audioBase64 } },
          { text: "Transcribe this audio exactly as spoken." }
        ]
      }
    });
    return response.text || "";
  } catch (error) {
    console.error("Transcription Error:", error);
    throw error;
  }
};

export const generateSpeech = async (text: string): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: TTS_MODEL,
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
        }
      }
    });
    
    const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!audioData) {
        console.warn("TTS Empty Response:", response);
        throw new Error("No audio generated");
    }
    return audioData;
  } catch (error) {
    console.error("TTS Error:", error);
    throw error;
  }
};
