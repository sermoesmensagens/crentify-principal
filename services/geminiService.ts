
import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

/**
 * Utility to try models in order of preference to avoid 404 errors.
 */
const getStableModel = (genAI: GoogleGenerativeAI, systemInstruction?: string, temperature: number = 0.7) => {
  // Use a fallback strategy: gemini-1.5-flash is preferred, gemini-pro is the generic fallback
  const modelsToTry = ["gemini-1.5-flash", "gemini-pro"];
  
  return genAI.getGenerativeModel({ 
    model: modelsToTry[0],
    generationConfig: { temperature }
  });
};

export const getMentorResponse = async (query: string) => {
  const genAI = new GoogleGenerativeAI(API_KEY);
  const systemInstruction = "Você é o 'Mentor IA CRENTIFY', um assistente teológico protestante. Suas respostas devem ser baseadas exclusivamente na teologia cristã protestante, citando versículos bíblicos (NVI ou Almeida) e mantendo um tom de encorajamento, sabedoria e instrução espiritual. Seja conciso mas profundo.";
  
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(`${systemInstruction}\n\nUsuário: ${query}`);
    const response = await result.response;
    return response.text();
  } catch (err: any) {
    console.warn("Retrying with fallback model due to error:", err.message);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(`${systemInstruction}\n\nUsuário: ${query}`);
    const response = await result.response;
    return response.text();
  }
};

export const generateContentScript = async (
  topic: string,
  platform: string,
  sources: string[],
  editorialAngle: string,
  transcript: string,
  transcriptSpeaker: string
) => {
  const genAI = new GoogleGenerativeAI(API_KEY);

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

  const fullPrompt = `${systemInstruction}\n\nTarefa: ${prompt}`;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash", generationConfig: { temperature: 0.7 } });
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    return response.text();
  } catch (err: any) {
    const model = genAI.getGenerativeModel({ model: "gemini-pro", generationConfig: { temperature: 0.7 } });
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    return response.text();
  }
};

export const generateReadingTitle = async (verses: string[]) => {
  const genAI = new GoogleGenerativeAI(API_KEY);
  const systemInstruction = `Você é um curador de conteúdo bíblico. Dada uma lista de versículos, crie um título curto, inspirador e direto para um dia de estudo bíblico.
  Exemplo: Gênesis 1-2 -> O Começo de Tudo
  Exemplo: Mateus 5-7 -> O Sermão do Monte`;

  const fullPrompt = `${systemInstruction}\n\nVersículos: ${verses.join(', ')}\n\nCrie um título curto (máx 5 palavras):`;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    return response.text().trim().replace(/^"/, '').replace(/"$/, '');
  } catch (err) {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    return response.text().trim().replace(/^"/, '').replace(/"$/, '');
  }
};

export const parseReadingPlanWithAi = async (text: string) => {
  const genAI = new GoogleGenerativeAI(API_KEY);
  const systemInstruction = `Você é um Assistente de Processamento de Dados Bíblicos.
  Sua tarefa é extrair um plano de leitura de um texto bruto e retornar APENAS um JSON válido.
  
  O JSON deve ser um array de objetos seguindo esta estrutura:
  [
    {
      "week": "Semana 1",
      "day": "Dia 1",
      "title": "Tema do Ponto/Reflexão",
      "verses": ["Gênesis 1", "Gênesis 2"]
    }
  ]
  
  REGRAS:
  1. Extraia o máximo de informações possível.
  2. Normalize a semana para "Semana X" e o dia para "Dia Y".
  3. No campo "verses", coloque apenas a referência (Ex: Mateus 5:1-12 ou Salmos 23).
  4. Se não houver um título claro para o dia, gere um pequeno resumo baseado nos versículos (Ex: "A Queda do Homem").
  5. Retorne APENAS o JSON, sem explicações ou markdown.`;

  const fullPrompt = `${systemInstruction}\n\nExtraia o plano de leitura deste texto:\n\n"""\n${text}\n"""`;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash", generationConfig: { temperature: 0.1 } });
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const responseText = response.text();

    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error("JSON not found");
    return JSON.parse(jsonMatch[0]);
  } catch (err) {
    const model = genAI.getGenerativeModel({ model: "gemini-pro", generationConfig: { temperature: 0.1 } });
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const responseText = response.text();
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error("JSON not found in fallback");
    return JSON.parse(jsonMatch[0]);
  }
};
