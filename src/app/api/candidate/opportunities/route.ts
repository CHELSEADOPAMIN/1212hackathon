import { getMatchesCollection, hydrateMatchRecords, serializeMatch } from "@/lib/matches";
import { findJobsForCandidate } from "@/lib/matching";
import { Match, MatchStatus } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";

// Only show "company_interested" in spotlight. "matched" should go to the matches page.
const SPOTLIGHT_STATUSES: MatchStatus[] = ["company_interested"];

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
    let interactedJobIds = new Set<string>();

    if (candidateId) {
      // Fetch ALL matches for this candidate to exclude them from recommendations
      // We include soft-deleted ones (rejections) because we don't want to show them again
      const allMatches = await matchesCollection
        .find({ candidateId })
        .sort({ matchScore: -1, updatedAt: -1 })
        .toArray();

      // Collect all job IDs that the candidate has already interacted with
      allMatches.forEach((m) => {
        if (m.jobId) interactedJobIds.add(toStringId(m.jobId));
      });

      // Filter spotlight items: only "company_interested" and NOT soft deleted
      spotlight = allMatches.filter((m) =>
        SPOTLIGHT_STATUSES.includes(m.status) &&
        (m.isSoftDeleted === false || m.isSoftDeleted === undefined)
      );
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

    // Filter out ANY job that has an existing match record (spotlight or otherwise)
    const recommendedJobs = recommendations
      .filter((job) => !interactedJobIds.has(toStringId(job._id || job.id)))
      .map((job) => formatJob(job));

    const merged = [...spotlightJobs, ...recommendedJobs];

    return NextResponse.json({ success: true, matches: merged });
  } catch (error: any) {
    console.error("Candidate opportunities error:", error);
    return NextResponse.json({ success: false, error: error.message || "Server error" }, { status: 500 });
  }
}
