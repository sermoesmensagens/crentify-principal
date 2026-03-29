
import { GoogleGenAI } from "@google/genai";

export const getMentorResponse = async (query: string) => {
  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-1.5-flash-latest',
    contents: query,
    config: {
      systemInstruction: "Você é o 'Mentor IA CRENTIFY', um assistente teológico protestante. Suas respostas devem ser baseadas exclusivamente na teologia cristã protestante, citando versículos bíblicos (NVI ou Almeida) e mantendo um tom de encorajamento, sabedoria e instrução espiritual. Seja conciso mas profundo.",
    },
  });
  return response.text;
};


export const generateContentScript = async (
  topic: string,
  platform: string,
  sources: string[],
  editorialAngle: string,
  transcript: string,
  transcriptSpeaker: string
) => {
  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

  let prompt = "";
  let systemInstruction = "";

  if (platform === 'WordPress') {
    systemInstruction = `Você é um Jornalista Cristão Sênior especializado em Hard News. 
    Regras de Escrita:
    1. Estrutura: Título (H1), Subtítulo (H2), Lead (O quê, Quem, Quando, Onde, Como, Por quê), Corpo da Notícia (Pirâmide Invertida), Conclusão.
    2. Linguagem: Clara, objetiva, profissional, sem metáforas.
    3. Capitalização Brasileira: Regra estrita para TÍTULO, SUBTÍTULO e INTERTÍTULOS: Use letra maiúscula APENAS na primeira letra da frase e em nomes próprios (lugares, pessoas, países). Todo o restante deve ser minúsculo. 
    4. Formatação: Use HTML para títulos (H1, H2, H3).
    5. Ângulo Editorial: Foque estritamente no ângulo fornecido pelo usuário.
    6. Fontes e Transcrição: Processe as fontes fornecidas. Se houver uma transcrição, cite o orador "${transcriptSpeaker}" de forma jornalística e ética.
    7. Extensão: ~600 palavras.`;

    prompt = `Escreva uma notícia completa para WordPress seguindo o padrão brasileiro de capitalização. Tópico: ${topic}. Ângulo Editorial: ${editorialAngle}. Fontes: ${sources.join(' | ')}. Transcrição: ${transcript}.`;
  } else {
    systemInstruction = `Você é um Roteirista e Jornalista Cristão Digital. Regras: Hook, Desenvolvimento, Conclusão. Tom imparcial mas espiritual.`;
    prompt = `Crie um roteiro de vídeo para ${platform}. Tópico: ${topic}. Ângulo: ${editorialAngle}.`;
  }

  const response = await ai.models.generateContent({
    model: 'gemini-1.5-flash-latest',
    contents: prompt,
    config: { systemInstruction, temperature: 0.7 }
  });

  return response.text;
};
