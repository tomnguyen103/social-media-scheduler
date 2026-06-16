import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { getGeminiModel } from "@/lib/gemini/client";
import { requireAI, PlanLimitError } from "@/lib/billing/guards";

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await requireAI(userId);
  } catch (err) {
    if (err instanceof PlanLimitError) {
      return NextResponse.json(
        { error: err.message },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: "Failed to verify plan limits" },
      { status: 500 }
    );
  }

  try {
    const { topic, context } = await request.json();

    const prompt = `Write an engaging social media caption.
Topic/Idea: ${topic || "Any interesting topic"}
Context/Tone details: ${context || "None"}
Please write only the caption itself, without any introductory or concluding remarks, and do not include hashtags. Make it ready to copy and paste.`;

    const model = getGeminiModel();
    const result = await model.generateContentStream(prompt);

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            controller.enqueue(new TextEncoder().encode(chunkText));
          }
        } catch (err) {
          controller.error(err);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error) {
    console.error("AI Caption generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate AI caption" },
      { status: 500 }
    );
  }
}
