
import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export const getMentorResponse = async (query: string) => {
  const genAI = new GoogleGenerativeAI(API_KEY);
  // Voltando para o v1beta e para o modelo 'latest' que não dava 404
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

  const systemInstruction = "Você é o 'Mentor IA CRENTIFY', um assistente teológico protestante. Suas respostas devem ser baseadas exclusivamente na teologia cristã protestante, citando versículos bíblicos (NVI ou Almeida) e mantendo um tom de encorajamento, sabedoria e instrução espiritual. Seja conciso mas profundo.";
  
  const fullPrompt = `${systemInstruction}\n\nUsuário: ${query}`;

  const result = await model.generateContent(fullPrompt);
  const response = await result.response;
  return response.text();
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
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest", generationConfig: { temperature: 0.7 } });

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
  const result = await model.generateContent(fullPrompt);
  const response = await result.response;
  return response.text();
};

export const generateReadingTitle = async (verses: string[]) => {
  const genAI = new GoogleGenerativeAI(API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

  const systemInstruction = `Você é um curador de conteúdo bíblico. Dada uma lista de versículos, crie um título curto, inspirador e direto para um dia de estudo bíblico.
  Exemplo: Gênesis 1-2 -> O Começo de Tudo`;

  const fullPrompt = `${systemInstruction}\n\nVersículos: ${verses.join(', ')}\n\nCrie um título curto (máx 5 palavras):`;

  try {
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    return response.text().trim().replace(/^"/, '').replace(/"$/, '');
  } catch (err) {
    console.error("Erro ao gerar título:", err);
    return "Temas do Dia";
  }
};

export const parseReadingPlanWithAi = async (text: string) => {
  const genAI = new GoogleGenerativeAI(API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest", generationConfig: { temperature: 0.1 } });

  const systemInstruction = `Você é um Assistente de Processamento de Dados Bíblicos.
  Sua tarefa é extrair um plano de leitura de um texto bruto e retornar APENAS um JSON válido.
  Formato: [{"week": "Semana 1", "day": "Dia 1", "title": "...", "verses": ["..."]}]`;

  const fullPrompt = `${systemInstruction}\n\nExtraia o plano de leitura deste texto:\n\n"""\n${text}\n"""`;

  try {
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const responseText = response.text();

    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error("JSON not found");
    return JSON.parse(jsonMatch[0]);
  } catch (err: any) {
    console.error("Erro no processamento IA:", err);
    throw new Error(`Erro na IA: ${err.message || 'Falha ao processar dados'}`);
  }
};
