import { getMatchesCollection, hydrateMatchRecords, serializeMatch } from "@/lib/matches";
import { MatchStatus } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";

const INTERVIEW_STATUSES: MatchStatus[] = ["matched", "interview_pending"];

export async function GET(req: NextRequest) {
  try {
    const candidateId = req.nextUrl.searchParams.get("candidateId");

    if (!candidateId) {
      return NextResponse.json({ success: false, error: "candidateId is required" }, { status: 400 });
    }

    const collection = await getMatchesCollection();
    const matches = await collection
      .find({
        candidateId,
        status: { $in: INTERVIEW_STATUSES },
        $or: [{ isSoftDeleted: { $exists: false } }, { isSoftDeleted: false }],
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
    console.error("Candidate interviews error:", error);
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
