import { NextRequest, NextResponse } from "next/server";

import dbConnect from "@/lib/db/mongodb";
import { Interview } from "@/lib/db/models";
import { updateMatchStatus } from "@/lib/matches";
import { ObjectId } from "mongodb";

const sanitizeInterview = (doc: unknown) => {
  if (!doc || typeof doc !== "object") return doc;
  // @ts-expect-error - handle mongoose docs and plain objects
  const plain = typeof doc.toObject === "function" ? doc.toObject() : doc;
  const interview = plain as { _id?: unknown };
  return {
    ...interview,
    _id: interview._id?.toString?.() ?? interview._id,
  };
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const matchId = body?.matchId;
    const rawQuestions = Array.isArray(body?.questions) ? body.questions : [];
    const questions = rawQuestions
      .map((q) => (typeof q === "string" ? q.trim() : ""))
      .filter(Boolean);

    if (!matchId || questions.length === 0) {
      return NextResponse.json(
        { success: false, error: "matchId and at least one question are required" },
        { status: 400 }
      );
    }

    await dbConnect();
    const normalizedMatchId = String(matchId);

    const interview = await Interview.findOneAndUpdate(
      { matchId: normalizedMatchId },
      {
        $set: {
          matchId: normalizedMatchId,
          questions,
          status: "scheduled",
        },
        $unset: { recordingUrl: "" },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    if (!interview) {
      return NextResponse.json(
        { success: false, error: "Failed to create interview" },
        { status: 500 }
      );
    }

    if (ObjectId.isValid(normalizedMatchId)) {
      try {
        await updateMatchStatus(normalizedMatchId, "interview_pending");
      } catch (error) {
        console.warn("Interview created but failed to update match status:", error);
      }
    }

    return NextResponse.json({ success: true, data: sanitizeInterview(interview) });
  } catch (error: unknown) {
    console.error("Create interview error:", error);
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
