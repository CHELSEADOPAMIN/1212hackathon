import { getMatchesCollection, serializeMatch } from "@/lib/matches";
import { ObjectId } from "mongodb";
import { NextRequest, NextResponse } from "next/server";

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
    const updateData: any = {
      $unset: { isSoftDeleted: "" }, // 移除软删除标记
      $set: {
        status: status || "candidate_interested", // 恢复为候选人感兴趣状态
        updatedAt: now,
      },
    };

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(matchId) },
      updateData,
      { returnDocument: "after" }
    );

    if (!result) {
      return NextResponse.json({ success: false, error: "Match not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: serializeMatch(result) });
  } catch (error: any) {
    console.error("Restore match error:", error);
    return NextResponse.json({ success: false, error: error.message || "Server error" }, { status: 500 });
  }
}