
import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

/**
 * Ultra-Resilient call to Gemini. 
 * Tries multiple models to avoid 404 (Not Found) and 429 (Quota Exceeded).
 */
async function callGemini(prompt: string, temperature: number = 0.7) {
  const genAI = new GoogleGenerativeAI(API_KEY);
  
  // Lista de modelos em ordem de preferência (Estratégia V2)
  // Flash 1.5 é o cavalo de batalha (15 RPM)
  // Flash 8b é ultra rápido e muitas vezes tem cota separada
  // Pro 1.5 é mais inteligente mas cota menor
  // 1.0 Pro fallback legado
  const models = ["gemini-1.5-flash", "gemini-1.5-flash-8b", "gemini-1.5-pro", "gemini-pro"];
  
  let lastError: any = null;

  for (const modelName of models) {
    let retryCount = 0;
    const maxRetries = 2; // Tentativas dentro do mesmo modelo

    while (retryCount <= maxRetries) {
      try {
        const model = genAI.getGenerativeModel({ 
          model: modelName, 
          generationConfig: { temperature } 
        });
        
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
      } catch (err: any) {
        const status = err.status || (err.message?.includes('404') ? 404 : err.message?.includes('429') ? 429 : 500);
        
        // Se for erro de quota (429), tentamos um retry rápido após 4 segundos
        if (status === 429 && retryCount < maxRetries) {
          retryCount++;
          console.warn(`[GEMINI V2] Quota atingida em ${modelName}. Retry ${retryCount}/${maxRetries} em 4s...`);
          await new Promise(resolve => setTimeout(resolve, 4000));
          continue;
        }

        lastError = err;
        console.warn(`[GEMINI V2] Tentativa com ${modelName} falhou (Status: ${status}).`);
        
        // Se for erro de quota (exauriu retries), esperamos 5s antes de tentar OUTRO modelo
        if (status === 429) {
          console.warn(`[GEMINI V2] Limite de Projeto/PPM provavelmente atingido. Pausando 5s antes de troca de modelo...`);
          await new Promise(resolve => setTimeout(resolve, 5000));
          break; // Sai do while para tentar o próximo modelo
        }

        if (status === 404) {
          break; 
        }
        
        throw err;
      }
    }
  }

  throw lastError || new Error("Todos os modelos da IA falharam. Verifique sua cota no Google AI Studio.");
}

export const getMentorResponse = async (query: string) => {
  const systemInstruction = "Você é o 'Mentor IA CRENTIFY', um assistente teológico protestante. Suas respostas devem ser baseadas exclusivamente na teologia cristã protestante, citando versículos bíblicos (NVI ou Almeida) e mantendo um tom de encorajamento, sabedoria e instrução espiritual. Seja conciso mas profundo.";
  return callGemini(`${systemInstruction}\n\nUsuário: ${query}`, 0.7);
};

export const generateContentScript = async (
  topic: string,
  platform: string,
  sources: string[],
  editorialAngle: string,
  transcript: string,
  transcriptSpeaker: string
) => {
  let prompt = "";
  let systemInstruction = "";

  if (platform === 'WordPress') {
    systemInstruction = `Você é um Jornalista Cristão Sênior especializado em Hard News. 
    Regras de Escrita:
    1. Estrutura: Título (H1), Subtítulo (H2), Lead (O quê, Quem, Quando, Onde, Como, Por quê), Corpo da Notícia (Pirâmide Invertida), Conclusão.
    2. Linguagem: Clara, objetiva, profissional, sem metáforas.
    3. Capitalização Brasileira: Regra estrita para TÍTULO, SUBTÍTULO e INTERTÍTULOS.
    4. Formatação: Use HTML para títulos (H1, H2, H3).
    5. Ângulo Editorial: Foque estritamente no ângulo fornecido pelo usuário.
    6. Fontes e Transcrição: Processe as fontes fornecidas. Se houver uma transcrição, cite o orador "${transcriptSpeaker}".
    7. Extensão: ~600 palavras.`;

    prompt = `Escreva uma notícia completa para WordPress seguindo o padrão brasileiro de capitalização. Tópico: ${topic}. Ângulo Editorial: ${editorialAngle}. Fontes: ${sources.join(' | ')}. Transcrição: ${transcript}.`;
  } else {
    systemInstruction = `Você é um Roteirista e Jornalista Cristão Digital. Regras: Hook, Desenvolvimento, Conclusão. Tom imparcial mas espiritual.`;
    prompt = `Crie um roteiro de vídeo para ${platform}. Tópico: ${topic}. Ângulo: ${editorialAngle}.`;
  }

  return callGemini(`${systemInstruction}\n\nTarefa: ${prompt}`, 0.7);
};

export const generateReadingTitle = async (verses: string[]) => {
  const systemInstruction = `Você é um curador de conteúdo bíblico. Dada uma lista de versículos, crie um título curto, inspirador e direto para um dia de estudo bíblico.
  Exemplo: Gênesis 1-2 -> O Começo de Tudo`;

  const fullPrompt = `${systemInstruction}\n\nVersículos: ${verses.join(', ')}\n\nCrie um título curto (máx 5 palavras):`;

  try {
    const text = await callGemini(fullPrompt, 0.7);
    return text.trim().replace(/^"/, '').replace(/"$/, '');
  } catch (error) {
    console.error("Erro ao gerar título:", error);
    return "Temas do Dia";
  }
};

export const parseReadingPlanWithAi = async (text: string) => {
  const systemInstruction = `Você é um Assistente de Processamento de Dados Bíblicos.
  Sua tarefa é extrair um plano de leitura de um texto bruto e retornar APENAS um JSON válido.
  Formato: [{"week": "Semana 1", "day": "Dia 1", "title": "...", "verses": ["..."]}]`;

  const fullPrompt = `${systemInstruction}\n\nExtraia o plano de leitura deste texto:\n\n"""\n${text}\n"""`;

  const responseText = await callGemini(fullPrompt, 0.1);
  const jsonMatch = responseText.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error("A IA não retornou um formato JSON válido.");
  return JSON.parse(jsonMatch[0]);
};
