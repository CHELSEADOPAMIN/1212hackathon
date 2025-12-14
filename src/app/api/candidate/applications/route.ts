import { getMatchesCollection, hydrateMatchRecords, serializeMatch } from "@/lib/matches";
import { MatchStatus } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";

const CANDIDATE_STATUSES: MatchStatus[] = [
  "candidate_interested",
  "company_interested",
  "matched",
  "interview_pending",
  "interview_completed",
  "offer_pending",
  "offer_accepted",
  "offer_rejected",
];

export async function GET(req: NextRequest) {
  try {
    const candidateId = req.nextUrl.searchParams.get("candidateId");

    if (!candidateId) {
      return NextResponse.json(
        { success: false, error: "candidateId is required" },
        { status: 400 }
      );
    }

    const collection = await getMatchesCollection();
    const matches = await collection
      .find({
        candidateId,
        status: { $in: CANDIDATE_STATUSES },
        $or: [{ isSoftDeleted: { $exists: false } }, { isSoftDeleted: false }],
      })
      .sort({ updatedAt: -1, matchScore: -1 })
      .toArray();

    // Deduplicate by job for this candidate, keeping the most recent entry
    const uniqueMap = new Map<string, (typeof matches)[number]>();
    matches.forEach((match) => {
      const key = `${match.jobId}-${match.companyId}`;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, match);
      }
    });

    const uniqueMatches = Array.from(uniqueMap.values());
    const hydrated = await hydrateMatchRecords(uniqueMatches);

    const data = hydrated.map((match) => ({
      ...serializeMatch(match),
      candidate: match.candidate || match.candidateSnapshot || null,
      job: match.job || match.jobSnapshot || null,
    }));

    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    console.error("Candidate applications error:", error);
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
