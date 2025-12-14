import { ObjectId } from "mongodb";

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

export interface Candidate {
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

export interface Job {
  _id?: ObjectId;
  title: string;
  company: string;
  location: string;
  type: string;
  salary: string;
  description: string;
  requirements: string[];
  postedAt?: Date;
  embedding: EmbeddingVector;
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
