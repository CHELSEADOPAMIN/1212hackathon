import { findJobsForCandidate } from "@/lib/matching";
import { getMatchesCollection, hydrateMatchRecords, serializeMatch } from "@/lib/matches";
import { Match, MatchStatus } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";

const SPOTLIGHT_STATUSES: MatchStatus[] = ["company_interested", "matched"];

const toStringId = (value: any) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (typeof value === "object" && (value as any).toString) return (value as any).toString();
  return "";
};

const formatJob = (
  job: any,
  extra?: {
    matchStatus?: MatchStatus;
    matchId?: string;
    matchScore?: number;
    companyId?: string;
    jobSnapshot?: Match["jobSnapshot"];
    jobId?: string;
  }
) => {
  const normalizedId = toStringId(job?._id) || job?.id || extra?.jobId || "";
  const base = job?.jobSnapshot || extra?.jobSnapshot;
  const normalizedCompanyId =
    toStringId(extra?.companyId) ||
    toStringId(job?.companyId) ||
    toStringId(job?.company) ||
    toStringId(base?.company);

  return {
    _id: normalizedId,
    id: normalizedId,
    title: job?.title || base?.title,
    company: job?.company || base?.company,
    location: job?.location || base?.location,
    salary: job?.salary || base?.salary || "—",
    description: job?.description || base?.description || "",
    requirements: job?.requirements || base?.requirements || [],
    score: job?.score || extra?.matchScore,
    matchStatus: extra?.matchStatus,
    matchId: extra?.matchId,
    companyId: normalizedCompanyId,
  };
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { profile, candidateId } = body || {};

    if (!profile) {
      return NextResponse.json({ success: false, error: "Missing profile" }, { status: 400 });
    }

    const [matchesCollection, recommendations] = await Promise.all([
      getMatchesCollection(),
      findJobsForCandidate(profile),
    ]);

    let spotlight: Match[] = [];

    if (candidateId) {
      spotlight = await matchesCollection
        .find({
          candidateId,
          status: { $in: SPOTLIGHT_STATUSES },
          $or: [{ isSoftDeleted: { $exists: false } }, { isSoftDeleted: false }],
        })
        .sort({ matchScore: -1, updatedAt: -1 })
        .toArray();
    }

    const hydratedSpotlight = await hydrateMatchRecords(spotlight);

    const spotlightJobs = hydratedSpotlight
      .map((match) => {
        const serialized = serializeMatch(match);
        const jobData = match.job || match.jobSnapshot || {};

        return formatJob(jobData, {
          matchStatus: match.status,
          matchId: (serialized as any)._id,
          matchScore: match.matchScore,
          companyId: (serialized as any).companyId,
          jobSnapshot: match.jobSnapshot,
          jobId: (serialized as any).jobId,
        });
      })
      .filter((job) => job.id);

    const spotlightJobIds = new Set(spotlightJobs.map((j) => j.id));

    const recommendedJobs = recommendations
      .filter((job) => !spotlightJobIds.has(job._id?.toString?.() || ""))
      .map((job) => formatJob(job));

    const merged = [...spotlightJobs, ...recommendedJobs];

    return NextResponse.json({ success: true, matches: merged });
  } catch (error: any) {
    console.error("Candidate opportunities error:", error);
    return NextResponse.json({ success: false, error: error.message || "Server error" }, { status: 500 });
  }
}
