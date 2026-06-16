import { GoogleGenerativeAI, type GenerativeModel } from "@google/generative-ai";

import { requireEnv } from "@/lib/env";

const DEFAULT_GEMINI_MODEL = "gemini-1.5-flash";

let geminiClient: GoogleGenerativeAI | null = null;
let geminiModel: GenerativeModel | null = null;

export function getGeminiClient() {
  if (!geminiClient) {
    geminiClient = new GoogleGenerativeAI(requireEnv("GEMINI_API_KEY"));
  }

  return geminiClient;
}

export function getGeminiModel() {
  if (!geminiModel) {
    geminiModel = getGeminiClient().getGenerativeModel({
      model: process.env.GEMINI_MODEL ?? DEFAULT_GEMINI_MODEL,
    });
  }

  return geminiModel;
}
