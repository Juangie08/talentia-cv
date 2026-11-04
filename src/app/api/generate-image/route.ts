import { NextResponse } from "next/server";


// In-memory rate limiting (for demo - use Redis in production)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 10; // Max requests per minute
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

// La generación de imágenes en proveedores externos puede tardar: se amplía
// el límite de la función serverless (60s es el máximo del plan Hobby).
export const maxDuration = 60;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (record.count >= RATE_LIMIT) {
    return false;
  }
  
  record.count++;
  return true;
}

// Image generation using OpenAI DALL-E
async function generateWithOpenAI(apiKey: string, prompt: string, model: string = "dall-e-3"): Promise<string> {
  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      prompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Error en OpenAI");
  }

  const result = await response.json();
  return result.data[0].url;
}

// Z.ai placeholder - currently doesn't support image generation
async function generateWithZai(): Promise<string> {
  throw new Error("Z.ai aún no soporta generación de imágenes. Usa OpenAI.");
}

// Image generation using Google Gemini (via vertex AI or image generation)
async function generateWithGemini(apiKey: string, prompt: string): Promise<string> {
  // Gemini 2.0 experimental can generate images
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`;
  
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.9,
        maxOutputTokens: 2048,
        topP: 0.95,
        topK: 40,
      },
      safetySettings: [
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    // If Gemini doesn't support image generation, try an alternative
    if (error.error?.message?.includes("unsupported")) {
      throw new Error("Gemini no soporta generación de imágenes. Usa OpenAI.");
    }
    throw new Error(error.error?.message || "Error en Gemini");
  }

  const result = await response.json();
  
  // Check for inline image data
  const inlineData = result.candidates?.[0]?.content?.parts?.[0]?.inlineData;
  if (inlineData?.data) {
    return `data:${inlineData.mimeType || "image/png"};base64,${inlineData.data}`;
  }
  
  // Check for image URL in text
  const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
  const urlMatch = text?.match(/https?:\/\/[^\s]+\.(?:png|jpg|jpeg|gif|webp)/i);
  if (urlMatch) {
    return urlMatch[0];
  }

  throw new Error("No se pudo generar la imagen. Intenta con OpenAI.");
}

export async function POST(req: Request) {
  // Rate limiting
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { message: "Demasiadas solicitudes. Intenta de nuevo en un minuto." },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const { provider, apiKey, prompt, model } = body;

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { message: "Se requiere un prompt" },
        { status: 400 }
      );
    }

    if (!apiKey || typeof apiKey !== "string") {
      return NextResponse.json(
        { message: "Se requiere API key" },
        { status: 400 }
      );
    }

    if (!provider || !["openai", "gemini", "zai"].includes(provider)) {
      return NextResponse.json(
        { message: "Proveedor no válido. Usa: openai, gemini, o zai" },
        { status: 400 }
      );
    }

    let imageUrl: string;

    switch (provider) {
      case "openai":
        imageUrl = await generateWithOpenAI(apiKey, prompt, model || "dall-e-3");
        break;
      case "gemini":
        imageUrl = await generateWithGemini(apiKey, prompt);
        break;
      case "zai":
        imageUrl = await generateWithZai();
        break;
      default:
        throw new Error("Proveedor no soportado");
    }

    return NextResponse.json({ url: imageUrl });
  } catch (error) {
    console.error("Error generating image:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ message }, { status: 500 });
  }
}
