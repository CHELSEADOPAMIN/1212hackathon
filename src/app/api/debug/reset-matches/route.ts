import { getMatchesCollection } from "@/lib/matches";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const collection = await getMatchesCollection();
    // 清空 matches 集合
    await collection.deleteMany({});

    return NextResponse.json({
      success: true,
      message: "All match history cleared. Candidates should reappear in Talent Radar."
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


