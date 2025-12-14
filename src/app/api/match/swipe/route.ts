import { NextRequest, NextResponse } from "next/server";
import { serializeMatch, upsertSwipe } from "@/lib/matches";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      actor,
      action,
      companyId,
      candidateId,
      jobId,
      matchScore,
      jobSnapshot,
      candidateSnapshot,
    } = body || {};

    if (!actor || !action || !companyId || !candidateId || !jobId) {
      return NextResponse.json(
        { success: false, error: "Missing actor, action, companyId, candidateId, or jobId" },
        { status: 400 }
      );
    }

    if (!["company", "candidate"].includes(actor)) {
      return NextResponse.json({ success: false, error: "Invalid actor" }, { status: 400 });
    }

    if (!["like", "reject"].includes(action)) {
      return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
    }

    const match = await upsertSwipe({
      actor,
      action,
      companyId,
      candidateId,
      jobId,
      matchScore,
      jobSnapshot,
      candidateSnapshot,
    });

    return NextResponse.json({ success: true, data: serializeMatch(match) });
  } catch (error: any) {
    console.error("Match swipe error:", error);
    return NextResponse.json({ success: false, error: error.message || "Server error" }, { status: 500 });
  }
}
