import { getMatchesCollection, serializeMatch } from "@/lib/matches";
import { ObjectId, type UpdateFilter } from "mongodb";
import { NextRequest, NextResponse } from "next/server";
import type { Match } from "@/lib/types";

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { matchId, status } = body || {};

    if (!matchId) {
      return NextResponse.json({ success: false, error: "matchId is required" }, { status: 400 });
    }

    if (!ObjectId.isValid(matchId)) {
      return NextResponse.json({ success: false, error: "Invalid matchId" }, { status: 400 });
    }

    const collection = await getMatchesCollection();
    const now = new Date();

    // 撤销软删除，将状态恢复为候选人感兴趣
    const updateData: UpdateFilter<Match> = {
      $unset: { isSoftDeleted: "" }, // 移除软删除标记
      $set: {
        status: (status as Match["status"]) || "candidate_interested",
        updatedAt: now,
      },
    };

    const updateResult = await collection.findOneAndUpdate(
      { _id: new ObjectId(matchId) },
      updateData,
      { returnDocument: "after" }
    );

    const updatedMatch = updateResult ?? null;

    if (!updatedMatch) {
      return NextResponse.json({ success: false, error: "Match not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: serializeMatch(updatedMatch) });
  } catch (error: unknown) {
    console.error("Restore match error:", error);
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
