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
    const { content, topic } = await request.json();

    const prompt = `Generate a list of 5-10 relevant and trending hashtags (starting with #) for this content:
Content: ${content || ""}
Topic/Context: ${topic || ""}
Return only the space-separated hashtags, with no other text or explanation. Example output: #summer #fashion #trends`;

    const model = getGeminiModel();
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });
    const responseText = result.response.text().trim();

    return NextResponse.json({ hashtags: responseText });
  } catch (error) {
    console.error("AI Hashtags generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate hashtags" },
      { status: 500 }
    );
  }
}
