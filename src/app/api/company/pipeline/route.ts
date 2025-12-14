import { getMatchesCollection, hydrateMatchRecords, serializeMatch } from "@/lib/matches";
import { MatchStatus } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";

const DEFAULT_COMPANY_ID = process.env.DEFAULT_COMPANY_ID || "demo-company";
const PIPELINE_STATUSES: MatchStatus[] = [
  "company_interested",
  "candidate_interested",
  "matched",
  "interview_pending",
];

export async function GET(req: NextRequest) {
  try {
    const companyId = req.nextUrl.searchParams.get("companyId") || DEFAULT_COMPANY_ID;
    const collection = await getMatchesCollection();

    const matches = await collection
      .find({
        companyId,
        status: { $in: PIPELINE_STATUSES },
        $or: [{ isSoftDeleted: { $exists: false } }, { isSoftDeleted: false }],
      })
      .sort({ updatedAt: -1, matchScore: -1 })
      .toArray();

    // Deduplicate: Keep only the latest match for each (candidateId, jobId) pair
    const uniqueMap = new Map<string, typeof matches[0]>();

    matches.forEach(match => {
      const key = `${match.candidateId}-${match.jobId}`;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, match);
      }
      // Since we sorted by updatedAt desc, the first one encountered is the latest
    });

    const uniqueMatches = Array.from(uniqueMap.values());

    const hydrated = await hydrateMatchRecords(uniqueMatches);

    const data = hydrated.map((match) => ({
      ...serializeMatch(match),
      candidate: match.candidate || match.candidateSnapshot || null,
      job: match.job || match.jobSnapshot || null,
    }));

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("Pipeline fetch error:", error);
    return NextResponse.json({ success: false, error: error.message || "Server error" }, { status: 500 });
  }
}
