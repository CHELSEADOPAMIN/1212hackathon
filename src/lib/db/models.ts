import mongoose, { Document, Model, Schema } from 'mongoose';

// --- Job Model ---

export interface IJob extends Document {
  title: string;
  company: string;
  location: string;
  type: string; // 'Full-time', 'Contract', etc.
  salary: string;
  description: string;
  requirements: string[];
  postedAt: Date;
  embedding: number[]; // Vector embedding
}

const JobSchema: Schema = new Schema({
  title: { type: String, required: true },
  company: { type: String, required: true },
  location: { type: String, required: true },
  type: { type: String, required: true },
  salary: { type: String, required: true },
  description: { type: String, required: true },
  requirements: { type: [String], required: true },
  postedAt: { type: Date, default: Date.now },
  embedding: { type: [Number], required: true, index: false }, // Vector Search uses a specific index definition, not standard mongoose index
});

// --- Candidate Model ---

export interface ISkill {
  name: string;
  level: number; // 0-100
  category?: string;
}

export interface ICandidate extends Document {
  name: string;
  role: string;
  summary: string;
  skills: ISkill[];
  email?: string;
  githubUrl?: string;
  matchReason?: string; // For UI display purposes
  embedding: number[]; // Vector embedding for (role + summary + skills)
}

const CandidateSchema: Schema = new Schema({
  name: { type: String, required: true },
  role: { type: String, required: true },
  summary: { type: String, required: true },
  skills: [
    {
      name: { type: String, required: true },
      level: { type: Number, required: true },
      category: { type: String },
    },
  ],
  email: { type: String },
  githubUrl: { type: String },
  matchReason: { type: String },
  embedding: { type: [Number], required: true, index: false },
});

// Avoid OverwriteModelError
export const Job: Model<IJob> = mongoose.models.Job || mongoose.model<IJob>('Job', JobSchema);
export const Candidate: Model<ICandidate> = mongoose.models.Candidate || mongoose.model<ICandidate>('Candidate', CandidateSchema);
