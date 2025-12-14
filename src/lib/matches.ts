import { getCollection } from "@/lib/db";
import {
  Candidate,
  Job,
  Match,
  MatchCandidateSnapshot,
  MatchJobSnapshot,
  MatchStatus,
} from "@/lib/types";
import { ObjectId } from "mongodb";

export interface SwipePayload {
  actor: "company" | "candidate";
  action: "like" | "reject";
  companyId: string;
  candidateId: string;
  jobId: string;
  matchScore?: number;
  jobSnapshot?: MatchJobSnapshot;
  candidateSnapshot?: MatchCandidateSnapshot;
}

const MATCH_COLLECTION = "matches";

const stringifyId = (value: unknown) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (value instanceof ObjectId) return value.toHexString();
  if (typeof value === "object" && (value as any).toString) return (value as any).toString();
  return "";
};

export function serializeMatch(match: Match | null) {
  if (!match) return null;
  return {
    ...match,
    _id: stringifyId(match._id),
    candidateId: stringifyId((match as any).candidateId),
    jobId: stringifyId((match as any).jobId),
  } as Match & { _id?: string };
}

export async function getMatchesCollection() {
  return getCollection<Match>(MATCH_COLLECTION);
}

export async function upsertSwipe(payload: SwipePayload): Promise<Match> {
  const collection = await getMatchesCollection();
  const now = new Date();

  const query = {
    companyId: payload.companyId,
    candidateId: payload.candidateId,
    jobId: payload.jobId,
  };

  if (payload.action === "reject") {
    const rejectStatus: MatchStatus =
      payload.actor === "candidate" ? "rejected_by_candidate" : "rejected";

    const result = await collection.findOneAndUpdate(
      query,
      {
        $set: {
          status: rejectStatus,
          updatedAt: now,
          isSoftDeleted: payload.actor === "company" ? true : false,
        },
        $setOnInsert: {
          initiator: payload.actor,
          matchScore: payload.matchScore ?? 0,
          createdAt: now,
          jobSnapshot: payload.jobSnapshot,
          candidateSnapshot: payload.candidateSnapshot,
        },
      },
      { returnDocument: "after", upsert: true }
    );

    if (!result) {
      throw new Error("Failed to write reject action");
    }

    return result;
  }

  const existing = await collection.findOne(query);

  if (!existing) {
    const doc: Match = {
      companyId: payload.companyId,
      candidateId: payload.candidateId,
      jobId: payload.jobId,
      status: payload.actor === "company" ? "company_interested" : "candidate_interested",
      initiator: payload.actor,
      matchScore: payload.matchScore,
      createdAt: now,
      updatedAt: now,
      isSoftDeleted: false,
      jobSnapshot: payload.jobSnapshot,
      candidateSnapshot: payload.candidateSnapshot,
    };

    const { insertedId } = await collection.insertOne(doc as any);
    return { ...doc, _id: insertedId } as Match;
  }

  const nextStatus: MatchStatus =
    payload.actor === "company"
      ? existing.status === "candidate_interested"
        ? "matched"
        : "company_interested"
      : existing.status === "company_interested"
        ? "matched"
        : "candidate_interested";

  const result = await collection.findOneAndUpdate(
    { _id: existing._id },
    {
      $set: {
        status: nextStatus,
        updatedAt: now,
        matchScore: payload.matchScore ?? existing.matchScore,
        isSoftDeleted: false,
        jobSnapshot: existing.jobSnapshot || payload.jobSnapshot,
        candidateSnapshot: existing.candidateSnapshot || payload.candidateSnapshot,
      },
      $setOnInsert: {
        initiator: existing.initiator ?? payload.actor,
        createdAt: existing.createdAt ?? now,
      },
    },
    { returnDocument: "after" }
  );

  if (!result) {
    throw new Error("Failed to update match");
  }

  return result;
}

export async function updateMatchStatus(
  matchId: string,
  status: MatchStatus,
  options?: { softDelete?: boolean }
): Promise<Match | null> {
  if (!ObjectId.isValid(matchId)) {
    throw new Error("Invalid matchId");
  }

  const collection = await getMatchesCollection();
  const now = new Date();

  const result = await collection.findOneAndUpdate(
    { _id: new ObjectId(matchId) },
    {
      $set: {
        status,
        updatedAt: now,
        ...(options?.softDelete ? { isSoftDeleted: true } : {}),
      },
    },
    { returnDocument: "after" }
  );

  return result;
}

export const hydrateMatchRecords = async (
  matches: Match[]
): Promise<
  Array<
    Match & {
      candidate?: Candidate | null;
      job?: Job | null;
      _id?: string;
    }
  >
> => {
  if (!matches.length) return [];

  const candidateIds = matches
    .map((m) => m.candidateId)
    .filter((id) => ObjectId.isValid(id))
    .map((id) => new ObjectId(id));
  const jobIds = matches
    .map((m) => m.jobId)
    .filter((id) => ObjectId.isValid(id))
    .map((id) => new ObjectId(id));

  const [candidatesCollection, jobsCollection] = await Promise.all([
    getCollection<Candidate>("candidates"),
    getCollection<Job>("jobs"),
  ]);

  const [candidateDocs, jobDocs] = await Promise.all([
    candidateIds.length
      ? candidatesCollection
        .find({ _id: { $in: candidateIds } })
        .project({ embedding: 0 })
        .toArray()
      : [],
    jobIds.length
      ? jobsCollection
        .find({ _id: { $in: jobIds } })
        .project({ embedding: 0 })
        .toArray()
      : [],
  ]);

  const candidateMap = new Map<string, Candidate>();
  candidateDocs.forEach((doc) => {
    candidateMap.set(stringifyId(doc._id), doc);
  });

  const jobMap = new Map<string, Job>();
  jobDocs.forEach((doc) => {
    jobMap.set(stringifyId(doc._id), doc);
  });

  return matches.map((match) => ({
    ...serializeMatch(match),
    candidate: candidateMap.get(stringifyId((match as any).candidateId)) || null,
    job: jobMap.get(stringifyId((match as any).jobId)) || null,
  }));
};

