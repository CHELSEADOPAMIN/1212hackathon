import { experimental_generateSpeech as generateSpeech } from "ai";
import { NextRequest, NextResponse } from "next/server";

import { openai } from "@ai-sdk/openai";

const MODEL_PREFERENCE = [
  process.env.OPENAI_TTS_MODEL || "gpt-4o-mini-tts",
  "tts-1",
] as const;

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const text = typeof body?.text === "string" ? body.text.trim() : "";
    const voice = typeof body?.voice === "string" ? body.voice : "alloy";

    if (!text) {
      return NextResponse.json({ success: false, error: "text is required" }, { status: 400 });
    }

    let audioBuffer: Buffer | null = null;
    let mediaType = "audio/mpeg";
    let lastError: unknown = null;

    for (const modelId of MODEL_PREFERENCE) {
      try {
        const { audio } = await generateSpeech({
          model: openai.speech(modelId),
          text,
          voice,
          outputFormat: "mp3",
        });
        audioBuffer = Buffer.from(audio.uint8Array);
        mediaType = audio.mediaType || mediaType;
        break;
      } catch (error) {
        lastError = error;
      }
    }

    if (!audioBuffer) {
      throw lastError || new Error("TTS generation failed");
    }

    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": mediaType,
        "Cache-Control": "no-store",
      },
    });
  } catch (error: unknown) {
    console.error("TTS generation error:", error);
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
