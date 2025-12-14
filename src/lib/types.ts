import { ObjectId, type Document } from "mongodb";

export type EmbeddingVector = number[];

export interface CandidateSkill {
  name: string;
  level?: number;
  category?: string;
}

export interface Experience {
  id?: string;
  role: string;
  company: string;
  period: string;
  description: string;
}

export interface Candidate extends Document {
  _id?: ObjectId;
  name: string;
  role: string;
  summary: string;
  skills: CandidateSkill[];
  experiences?: Experience[];
  email?: string;
  githubUrl?: string;
  matchReason?: string;
  embedding: EmbeddingVector;
}

export interface Job extends Document {
  _id?: ObjectId;
  title: string;
  company: string;
  companyId?: string;
  companyEmail?: string;
  location: string;
  type: string;
  salary: string;
  description: string;
  requirements: string[];
  postedAt?: Date;
  embedding: EmbeddingVector;
}

export interface Company {
  _id?: ObjectId | string;
  name: string;
  description?: string;
  industry?: string;
  website?: string;
  location?: string;
  logoUrl?: string;
}

export interface CandidateProfileInput {
  name?: string;
  role?: string;
  summary?: string;
  skills?: Array<string | CandidateSkill>;
  experiences?: Experience[];
  location?: string;
}

export interface JobProfileInput {
  title?: string;
  description?: string;
  requirements?: string[];
  company?: string;
  location?: string;
  type?: string;
}

export type MatchStatus =
  | "company_interested"
  | "candidate_interested"
  | "matched"
  | "interview_pending"
  | "interview_completed"
  | "offer_pending"
  | "offer_accepted"
  | "offer_rejected"
  | "rejected"
  | "rejected_by_candidate";

export interface MatchOffer {
  amount: number;
  currency: string;
  message?: string;
  createdAt: Date;
}

export interface MatchJobSnapshot {
  title?: string;
  company?: string;
  salary?: string;
  location?: string;
  description?: string;
  requirements?: string[];
}

export interface MatchCandidateSnapshot {
  name?: string;
  role?: string;
  summary?: string;
  avatar?: string;
  skills?: Array<{ name?: string; subject?: string; level?: number; category?: string }>;
}

export interface Match {
  _id?: ObjectId;
  companyId: string;
  candidateId: string;
  jobId: string;
  status: MatchStatus;
  initiator: "company" | "candidate";
  matchScore?: number;
  createdAt: Date;
  updatedAt: Date;
  isSoftDeleted?: boolean;
  offer?: MatchOffer;
  jobSnapshot?: MatchJobSnapshot;
  candidateSnapshot?: MatchCandidateSnapshot;
}
