import { getCollection } from "@/lib/db";
import { getMatchesCollection, hydrateMatchRecords, serializeMatch } from "@/lib/matches";
import { MatchStatus } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";

const DEFAULT_COMPANY_ID = process.env.DEFAULT_COMPANY_ID || "demo-company";
const PIPELINE_STATUSES: MatchStatus[] = [
  "company_interested",
  "candidate_interested",
  "matched",
  "interview_pending",
  "interview_completed",
  "offer_pending",
  "offer_accepted",
  "offer_rejected",
];
const OFFER_STATUSES: MatchStatus[] = ["offer_pending", "offer_accepted"];

const toIdString = (value: unknown) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number") return value.toString();
  if (typeof value === "object" && value !== null && "toString" in value) {
    return value.toString();
  }
  return String(value);
};

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

    const offerCandidateIds = Array.from(
      new Set(
        hydrated
          .filter((match) => OFFER_STATUSES.includes(match.status))
          .map((match) => toIdString(match.candidateId))
          .filter(Boolean)
      )
    );

    const interviewMatchIds = Array.from(
      new Set(
        hydrated
          .filter((match) => match.status === "interview_completed")
          .map((match) => toIdString(match._id))
          .filter(Boolean)
      )
    );

    let offerStatsMap = new Map<
      string,
      { marketOffer: number; offerCount: number; averageOffer: number }
    >();

    if (offerCandidateIds.length > 0) {
      const competitorStats = await collection
        .aggregate([
          {
            $match: {
              candidateId: { $in: offerCandidateIds },
              status: { $in: OFFER_STATUSES },
              companyId: { $ne: companyId },
              "offer.amount": { $type: "number" },
              $or: [{ isSoftDeleted: { $exists: false } }, { isSoftDeleted: false }],
            },
          },
          {
            $group: {
              _id: "$candidateId",
              marketOffer: { $max: "$offer.amount" },
              offerCount: { $sum: 1 },
              averageOffer: { $avg: "$offer.amount" },
            },
          },
        ])
        .toArray();

      offerStatsMap = new Map(
        competitorStats.map((item) => [
          toIdString(item._id),
          {
            marketOffer: item.marketOffer ?? 0,
            offerCount: item.offerCount ?? 0,
            averageOffer: item.averageOffer ?? 0,
          },
        ])
      );
    }

    let interviewMap = new Map<
      string,
      { _id?: string; matchId?: string; recordingUrl?: string; createdAt?: Date; updatedAt?: Date }
    >();

    if (interviewMatchIds.length > 0) {
      const interviewsCollection = await getCollection("interviews");
      const interviewDocs = await interviewsCollection
        .find({
          matchId: { $in: interviewMatchIds },
          status: "completed",
        })
        .project({ recordingUrl: 1, matchId: 1, createdAt: 1, updatedAt: 1 })
        .toArray();

      interviewMap = new Map(
        interviewDocs.map((doc) => [
          toIdString(doc.matchId),
          {
            _id: toIdString(doc._id),
            matchId: toIdString(doc.matchId),
            recordingUrl: doc.recordingUrl as string | undefined,
            createdAt: doc.createdAt as Date | undefined,
            updatedAt: doc.updatedAt as Date | undefined,
          },
        ])
      );
    }

    const data = hydrated.map((match) => ({
      ...serializeMatch(match),
      candidate: match.candidate || match.candidateSnapshot || null,
      job: match.job || match.jobSnapshot || null,
      marketOffer: OFFER_STATUSES.includes(match.status)
        ? offerStatsMap.get(toIdString(match.candidateId))?.marketOffer ?? 0
        : undefined,
      offerCount: OFFER_STATUSES.includes(match.status)
        ? offerStatsMap.get(toIdString(match.candidateId))?.offerCount ?? 0
        : undefined,
      averageCompetitorOffer: OFFER_STATUSES.includes(match.status)
        ? offerStatsMap.get(toIdString(match.candidateId))?.averageOffer
        : undefined,
      interview: match.status === "interview_completed"
        ? interviewMap.get(toIdString(match._id))
        : undefined,
    }));

    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    console.error("Pipeline fetch error:", error);
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
