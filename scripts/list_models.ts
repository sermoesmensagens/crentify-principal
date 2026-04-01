
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function listModels() {
  const apiKey = process.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    console.error("VITE_GEMINI_API_KEY not found in .env.local");
    return;
  }

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`);
    const data = await response.json();
    console.log("Models (v1):", JSON.stringify(data, null, 2));

    const responseBeta = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const dataBeta = await responseBeta.json();
    console.log("Models (v1beta):", JSON.stringify(dataBeta, null, 2));
  } catch (err) {
    console.error("Error fetching models:", err);
  }
}

listModels();
