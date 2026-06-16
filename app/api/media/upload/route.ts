import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { getImageKitClient } from "@/lib/imagekit/client";

export async function POST() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const imagekit = getImageKitClient();
    const authParams = imagekit.getAuthenticationParameters();
    return NextResponse.json(authParams);
  } catch (error) {
    console.error("Failed to generate ImageKit auth params:", error);
    return NextResponse.json(
      { error: "Failed to generate upload credentials" },
      { status: 500 }
    );
  }
}
