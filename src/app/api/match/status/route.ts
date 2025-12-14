import { NextRequest, NextResponse } from "next/server";
import { serializeMatch, updateMatchStatus } from "@/lib/matches";
import { MatchStatus } from "@/lib/types";

const ALLOWED_STATUSES: MatchStatus[] = [
  "company_interested",
  "candidate_interested",
  "matched",
  "interview_pending",
  "rejected",
  "rejected_by_candidate",
];

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { matchId, status, softDelete } = body || {};

    if (!matchId || !status) {
      return NextResponse.json({ success: false, error: "matchId and status are required" }, { status: 400 });
    }

    if (!ALLOWED_STATUSES.includes(status)) {
      return NextResponse.json({ success: false, error: "Invalid status" }, { status: 400 });
    }

    const updated = await updateMatchStatus(matchId, status, { softDelete });

    if (!updated) {
      return NextResponse.json({ success: false, error: "Match not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: serializeMatch(updated) });
  } catch (error: any) {
    console.error("Update match status error:", error);
    return NextResponse.json({ success: false, error: error.message || "Server error" }, { status: 500 });
  }
}
