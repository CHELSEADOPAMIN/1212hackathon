import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";

import { getMatchesCollection, serializeMatch } from "@/lib/matches";

export const runtime = "nodejs";

const DEFAULT_CURRENCY = "USD";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { matchId, amount, message, currency } = body || {};

    if (!matchId) {
      return NextResponse.json(
        { success: false, error: "matchId is required" },
        { status: 400 }
      );
    }

    const numericAmount = typeof amount === "string" ? Number(amount) : amount;
    if (!Number.isFinite(numericAmount)) {
      return NextResponse.json(
        { success: false, error: "Offer amount must be a valid number" },
        { status: 400 }
      );
    }

    if (Number(numericAmount) <= 0) {
      return NextResponse.json(
        { success: false, error: "Offer amount must be greater than zero" },
        { status: 400 }
      );
    }

    const collection = await getMatchesCollection();
    const now = new Date();
    const query = ObjectId.isValid(matchId) ? { _id: new ObjectId(matchId) } : { _id: matchId };

    const offer = {
      amount: numericAmount,
      currency:
        typeof currency === "string" && currency.trim().length > 0
          ? currency.trim().toUpperCase()
          : DEFAULT_CURRENCY,
      message: typeof message === "string" && message.trim().length > 0 ? message.trim() : undefined,
      createdAt: now,
    };

    const updated = await collection.findOneAndUpdate(
      query,
      {
        $set: {
          status: "offer_pending",
          updatedAt: now,
          isSoftDeleted: false,
          offer,
        },
      },
      { returnDocument: "after" }
    );

    if (!updated) {
      return NextResponse.json({ success: false, error: "Match not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: serializeMatch(updated) });
  } catch (error: unknown) {
    console.error("Create/update offer error:", error);
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
