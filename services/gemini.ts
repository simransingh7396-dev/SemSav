
import { GoogleGenAI, Type } from "@google/genai";
import { GeminiExtraction } from "../types";

export const extractContentFromImage = async (base64Image: string, mimeType: string = 'image/jpeg'): Promise<GeminiExtraction | null> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp', 
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Image,
            },
          },
          {
            text: "Extract the Subject Name, Assignment Title, and Deadline Date from this image of a blackboard or syllabus. Return it as a clean JSON object with fields: subjectName, assignmentTitle, and deadlineDate. The deadlineDate must be in YYYY-MM-DD format (e.g., 2024-12-31). If a field is not found, use 'Not found'.",
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            subjectName: { type: Type.STRING },
            assignmentTitle: { type: Type.STRING },
            deadlineDate: { type: Type.STRING },
          },
          required: ["subjectName", "assignmentTitle", "deadlineDate"]
        },
      },
    });

    if (response.text) {
      return JSON.parse(response.text.trim()) as GeminiExtraction;
    }
    return null;
  } catch (error) {
    console.error("Gemini Extraction Error:", error);
    return null;
  }
};

export const generateNotesFromPDF = async (base64Pdf: string): Promise<string | null> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp', 
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'application/pdf',
              data: base64Pdf,
            },
          },
          {
            text: "You are an expert academic tutor. Read this PDF document thoroughly. Generate a comprehensive, structured set of study notes. Include: 1. A Main Title. 2. Key Concepts with definitions. 3. Important Formulas or Bullet points. 4. A brief Summary at the end. Format the output as clean text suitable for a document.",
          },
        ],
      },
    });

    return response.text || null;
  } catch (error) {
    console.error("Gemini PDF Notes Error:", error);
    return null;
  }
};
