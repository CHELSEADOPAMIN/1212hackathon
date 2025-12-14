import { NextRequest, NextResponse } from "next/server";

import dbConnect from "@/lib/db/mongodb";
import { Interview } from "@/lib/db/models";
import { getMatchesCollection, hydrateMatchRecords, serializeMatch } from "@/lib/matches";
import { ObjectId } from "mongodb";

const toIdString = (value: unknown) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && value !== null && "toString" in value) return value.toString();
  return String(value);
};

type InterviewLike = {
  _id?: unknown;
  matchId?: unknown;
  toObject?: () => Record<string, unknown>;
} | null | undefined;

const formatInterview = (item: InterviewLike) => {
  if (!item) return item;
  const base = typeof item.toObject === "function" ? item.toObject() : item;
  const normalized = base as { _id?: unknown; matchId?: unknown };
  return {
    ...base,
    _id: toIdString(normalized._id),
    matchId: toIdString(normalized.matchId),
  };
};

const MATCH_FILTER = ["matched", "interview_pending", "interview_completed"] as const;

export async function GET(req: NextRequest) {
  try {
    const candidateId = req.nextUrl.searchParams.get("candidateId");
    const interviewId = req.nextUrl.searchParams.get("interviewId");

    if (!candidateId && !interviewId) {
      return NextResponse.json(
        { success: false, error: "candidateId is required" },
        { status: 400 }
      );
    }

    await dbConnect();

    const matchesCollection = await getMatchesCollection();

    // Detail mode: fetch single interview by id (and optional candidate guard)
    if (interviewId) {
      const interview = await Interview.findById(interviewId);
      if (!interview) {
        return NextResponse.json({ success: false, error: "Interview not found" }, { status: 404 });
      }

      let hydratedMatch = null;
      const rawMatchId = toIdString(interview.matchId);
      if (ObjectId.isValid(rawMatchId)) {
        const matchDoc = await matchesCollection.findOne({
          _id: new ObjectId(rawMatchId),
          ...(candidateId ? { candidateId } : {}),
          $or: [{ isSoftDeleted: { $exists: false } }, { isSoftDeleted: false }],
        });
        if (matchDoc) {
          const hydrated = await hydrateMatchRecords([matchDoc]);
          hydratedMatch = hydrated[0] || null;
        }
      }

      return NextResponse.json({
        success: true,
        data: {
          ...formatInterview(interview),
          match: hydratedMatch
            ? {
                ...serializeMatch(hydratedMatch),
                candidate: hydratedMatch.candidate || hydratedMatch.candidateSnapshot || null,
                job: hydratedMatch.job || hydratedMatch.jobSnapshot || null,
              }
            : null,
        },
      });
    }

    if (!candidateId) {
      return NextResponse.json(
        { success: false, error: "candidateId is required" },
        { status: 400 }
      );
    }

    const matches = await matchesCollection
      .find({
        candidateId,
        status: { $in: MATCH_FILTER },
        $or: [{ isSoftDeleted: { $exists: false } }, { isSoftDeleted: false }],
      })
      .sort({ updatedAt: -1 })
      .toArray();

    const hydrated = await hydrateMatchRecords(matches);
    const matchIdSet = new Set(hydrated.map((match) => toIdString(match._id)));
    const matchMap = new Map<string, (typeof hydrated)[number]>();
    hydrated.forEach((match) => {
      matchMap.set(toIdString(match._id), match);
    });

    const interviews = await Interview.find({
      matchId: { $in: Array.from(matchIdSet) },
      status: { $in: ["scheduled", "completed"] },
    })
      .sort({ createdAt: -1 })
      .lean();

    const data = interviews.map((interview) => {
      const formatted = formatInterview(interview);
      if (!formatted) return null;
      const match = matchMap.get(formatted.matchId);
      return {
        ...formatted,
        match: match
          ? {
              ...serializeMatch(match),
              candidate: match.candidate || match.candidateSnapshot || null,
              job: match.job || match.jobSnapshot || null,
            }
          : null,
      };
    }).filter(Boolean);

    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    console.error("Upcoming interviews error:", error);
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
