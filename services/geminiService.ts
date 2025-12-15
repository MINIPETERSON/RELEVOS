import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Incident, IncidentType, Priority, Responsible, Status } from "../types";

// Define the response schema for strict JSON output
const incidentSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING, description: "Un nombre muy corto (2-4 palabras) para identificar el incidente" },
    date: { type: Type.STRING, description: "Date in YYYY-MM-DD format" },
    type: { 
      type: Type.STRING, 
      enum: ['GSR', 'CSR', 'ASR', 'Gestión de riesgos', 'PRL', 'Otro'],
      description: "The type of incident based on the description"
    },
    subject: { type: Type.STRING, description: "A brief summary of the incident" },
    responsible: { 
      type: Type.STRING, 
      enum: ['ALEX', 'PEDRO', 'OLEK', 'Sin Asignar'],
      description: "Infer the responsible person. Default to 'Sin Asignar' if unclear."
    },
    priority: { 
      type: Type.STRING, 
      enum: ['Alta', 'Media', 'Baja'],
      description: "Infer priority based on urgency words."
    }
  },
  required: ["name", "date", "type", "subject", "responsible", "priority"]
};

export const parseIncidentFromText = async (text: string): Promise<Partial<Incident> | null> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API Key not found");
    return null;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Analiza el siguiente texto y extrae los datos para un nuevo incidente. 
      Hoy es ${new Date().toISOString().split('T')[0]}.
      
      Texto: "${text}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: incidentSchema,
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as Partial<Incident>;
    }
    return null;

  } catch (error) {
    console.error("Error parsing incident with Gemini:", error);
    return null;
  }
};