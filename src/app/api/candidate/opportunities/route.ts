import { getMatchesCollection, hydrateMatchRecords, serializeMatch } from "@/lib/matches";
import { findJobsForCandidate } from "@/lib/matching";
import { Match, MatchStatus, type CandidateProfileInput, type Job } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";

// Only show "company_interested" in spotlight. "matched" should go to the matches page.
const SPOTLIGHT_STATUSES: MatchStatus[] = ["company_interested"];

type IdLike = string | number | { toString(): string } | null | undefined;

const toStringId = (value: IdLike) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (typeof value === "object" && "toString" in value) return value.toString();
  return "";
};

type JobLike = Partial<Job> & {
  _id?: IdLike;
  id?: IdLike;
  score?: number;
  jobSnapshot?: Match["jobSnapshot"];
};

interface FormattedJob {
  _id: string;
  id: string;
  title?: string;
  company?: string;
  location?: string;
  salary?: string;
  description?: string;
  requirements: string[];
  score?: number;
  matchStatus?: MatchStatus;
  matchId?: string;
  companyId?: string;
}

const formatJob = (
  job: JobLike,
  extra?: {
    matchStatus?: MatchStatus;
    matchId?: string;
    matchScore?: number;
    companyId?: string;
    jobSnapshot?: Match["jobSnapshot"];
    jobId?: string;
  }
): FormattedJob => {
  const normalizedId =
    toStringId(job?._id) ||
    toStringId(job?.id) ||
    toStringId(extra?.jobId) ||
    "";
  const base = job?.jobSnapshot || extra?.jobSnapshot;
  const requirements = Array.isArray(job?.requirements)
    ? job.requirements
    : Array.isArray(base?.requirements)
      ? base.requirements
      : [];

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
    requirements,
    score: job?.score || extra?.matchScore,
    matchStatus: extra?.matchStatus,
    matchId: extra?.matchId,
    companyId: normalizedCompanyId,
  };
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      profile?: CandidateProfileInput;
      candidateId?: string;
    };
    const { profile, candidateId } = body;

    if (!profile) {
      return NextResponse.json({ success: false, error: "Missing profile" }, { status: 400 });
    }

    const matchesCollection = await getMatchesCollection();
    const recommendations = (await findJobsForCandidate(profile)) as JobLike[];

    let spotlight: Match[] = [];
    const interactedJobIds = new Set<string>();

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
        if (!serialized) return null;

        const jobData = (match.job as JobLike) || (match.jobSnapshot as JobLike) || {};

        return formatJob(jobData, {
          matchStatus: match.status,
          matchId: serialized._id || "",
          matchScore: match.matchScore,
          companyId: serialized.companyId,
          jobSnapshot: match.jobSnapshot,
          jobId: serialized.jobId,
        });
      })
      .filter((job): job is FormattedJob => Boolean(job?.id));

    // Filter out ANY job that has an existing match record (spotlight or otherwise)
    const recommendedJobs = recommendations
      .filter((job) => !interactedJobIds.has(toStringId(job._id) || toStringId(job.id)))
      .map((job) => formatJob(job));

    const merged = [...spotlightJobs, ...recommendedJobs];

    return NextResponse.json({ success: true, matches: merged });
  } catch (error: unknown) {
    console.error("Candidate opportunities error:", error);
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
