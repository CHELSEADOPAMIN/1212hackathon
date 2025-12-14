import { generateEmbedding } from "@/lib/ai/embedding";
import { getCollection } from "@/lib/db";
import {
  Candidate,
  CandidateProfileInput,
  Job,
  JobProfileInput,
} from "@/lib/types";

const JOBS_VECTOR_INDEX = process.env.MONGODB_JOBS_INDEX || "vector_index";
const CANDIDATES_VECTOR_INDEX = process.env.MONGODB_CANDIDATES_INDEX || "vector_index";
const NUM_CANDIDATES =
  Number(process.env.MONGODB_VECTOR_CANDIDATES ?? 100) || 100;
const LIMIT = Number(process.env.MONGODB_VECTOR_LIMIT ?? 10) || 10;

export function buildCandidateProfileText(profile: CandidateProfileInput) {
  const skillNames = (profile.skills || [])
    .map((s) => (typeof s === "string" ? s : s?.name))
    .filter(Boolean)
    .join(", ");

  return [
    profile.name ? `Name: ${profile.name}` : "",
    profile.role ? `Role: ${profile.role}` : "",
    profile.summary ? `Summary: ${profile.summary}` : "",
    skillNames ? `Skills: ${skillNames}` : "",
    profile.location ? `Location: ${profile.location}` : "",
  ]
    .filter(Boolean)
    .join(". ");
}

export function buildJobProfileText(job: JobProfileInput) {
  const requirements = (job.requirements || []).join(", ");

  return [
    job.title ? `Title: ${job.title}` : "",
    job.company ? `Company: ${job.company}` : "",
    job.location ? `Location: ${job.location}` : "",
    job.type ? `Type: ${job.type}` : "",
    job.description ? `Description: ${job.description}` : "",
    requirements ? `Requirements: ${requirements}` : "",
  ]
    .filter(Boolean)
    .join(". ");
}

export async function findJobsForCandidate(profile: CandidateProfileInput) {
  const text = buildCandidateProfileText(profile);
  if (!text) {
    throw new Error("Profile data is required to run vector search");
  }

  const queryVector = await generateEmbedding(text);
  const collection = await getCollection<Job>("jobs");

  const pipeline = [
    {
      $vectorSearch: {
        index: JOBS_VECTOR_INDEX,
        path: "embedding",
        queryVector,
        numCandidates: NUM_CANDIDATES,
        limit: LIMIT,
      },
    },
    {
      $project: {
        embedding: 0,
        score: { $meta: "vectorSearchScore" },
      },
    },
  ];

  return collection.aggregate<(Job & { score?: number })>(pipeline).toArray();
}

export async function findCandidatesForJob(jobInput: JobProfileInput) {
  const text = buildJobProfileText(jobInput);
  if (!text) {
    throw new Error("Job data is required to run vector search");
  }

  const queryVector = await generateEmbedding(text);
  const collection = await getCollection<Candidate>("candidates");

  const pipeline = [
    {
      $vectorSearch: {
        index: CANDIDATES_VECTOR_INDEX,
        path: "embedding",
        queryVector,
        numCandidates: NUM_CANDIDATES,
        limit: LIMIT,
      },
    },
    {
      $project: {
        embedding: 0,
        score: { $meta: "vectorSearchScore" },
      },
    },
  ];

  return collection.aggregate<(Candidate & { score?: number })>(pipeline).toArray();
}
