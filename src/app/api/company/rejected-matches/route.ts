import { getMatchesCollection, hydrateMatchRecords, serializeMatch } from "@/lib/matches";
import { MatchStatus } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";

const REJECTED_STATUSES: MatchStatus[] = ["rejected"];

export async function GET(req: NextRequest) {
  try {
    const companyId = req.nextUrl.searchParams.get("companyId");

    if (!companyId) {
      return NextResponse.json({ success: false, error: "companyId is required" }, { status: 400 });
    }

    const collection = await getMatchesCollection();

    // 获取被软删除的匹配记录
    const matches = await collection
      .find({
        companyId,
        status: { $in: REJECTED_STATUSES },
        isSoftDeleted: true, // 只获取软删除的记录
      })
      .sort({ updatedAt: -1 })
      .toArray();

    const hydrated = await hydrateMatchRecords(matches);

    const data = hydrated.map((match) => ({
      ...serializeMatch(match),
      candidate: match.candidate || match.candidateSnapshot || null,
      job: match.job || match.jobSnapshot || null,
    }));

    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    console.error("Rejected matches fetch error:", error);
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
