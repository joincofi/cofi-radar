import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";

const SYSTEM_PROMPT = `You are answering a software buyer's question honestly.
If unsure about specifics like pricing or policies, say so explicitly.
Do not invent pricing, feature lists, or compliance certifications.
Keep your answer focused and under 300 words.`;

// ─── OpenAI (ChatGPT) ────────────────────────────────────────────────────────
const OPENAI_MODEL = "gpt-4o";

async function callOpenAI(prompt: string): Promise<string> {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const res = await client.chat.completions.create({
    model: OPENAI_MODEL,
    max_tokens: 500,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: prompt },
    ],
  });
  return res.choices[0]?.message?.content ?? "";
}

// ─── Anthropic (Claude) ──────────────────────────────────────────────────────
const ANTHROPIC_MODEL = "claude-sonnet-4-20250514";

async function callAnthropic(prompt: string): Promise<string> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const res = await client.messages.create({
    model: ANTHROPIC_MODEL,
    max_tokens: 500,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: prompt }],
  });
  const block = res.content[0];
  return block.type === "text" ? block.text : "";
}

// ─── Google Gemini ───────────────────────────────────────────────────────────
const GEMINI_MODEL = "gemini-1.5-pro";

async function callGemini(prompt: string): Promise<string> {
  const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model = genai.getGenerativeModel({
    model: GEMINI_MODEL,
    systemInstruction: SYSTEM_PROMPT,
  });
  const res = await model.generateContent(prompt);
  return res.response.text();
}

// ─── Perplexity ──────────────────────────────────────────────────────────────
const PERPLEXITY_MODEL = "sonar";
const PERPLEXITY_BASE_URL = "https://api.perplexity.ai/chat/completions";

async function callPerplexity(prompt: string): Promise<string> {
  const res = await fetch(PERPLEXITY_BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.PERPLEXITY_API_KEY}`,
    },
    body: JSON.stringify({
      model: PERPLEXITY_MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
      max_tokens: 500,
    }),
  });
  const data = (await res.json()) as {
    choices: Array<{ message: { content: string } }>;
  };
  return data.choices[0]?.message?.content ?? "";
}

// ─── Public dispatcher ───────────────────────────────────────────────────────
export type ModelName = "ChatGPT" | "Claude" | "Gemini" | "Perplexity";

export async function callModel(
  modelName: ModelName,
  prompt: string
): Promise<string> {
  switch (modelName) {
    case "ChatGPT":
      return callOpenAI(prompt);
    case "Claude":
      return callAnthropic(prompt);
    case "Gemini":
      return callGemini(prompt);
    case "Perplexity":
      return callPerplexity(prompt);
  }
}
