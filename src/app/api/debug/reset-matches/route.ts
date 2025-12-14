import { getMatchesCollection } from "@/lib/matches";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const collection = await getMatchesCollection();
    // 清空 matches 集合
    await collection.deleteMany({});

    return NextResponse.json({
      success: true,
      message: "All match history cleared. Candidates should reappear in Talent Radar."
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
