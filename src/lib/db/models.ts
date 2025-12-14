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

export interface IExperience {
  role: string;
  company: string;
  period: string;
  description: string;
}

export interface ICandidate extends Document {
  name: string;
  role: string;
  summary: string;
  skills: ISkill[];
  experiences?: IExperience[];
  email: string; // Made required for identity
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
  experiences: [
    {
      role: { type: String },
      company: { type: String },
      period: { type: String },
      description: { type: String },
    }
  ],
  email: { type: String, required: true, unique: true }, // Unique index
  githubUrl: { type: String },
  matchReason: { type: String },
  embedding: { type: [Number], required: true, index: false },
});

// --- Application Model ---

export interface IApplication extends Document {
  candidateId: mongoose.Types.ObjectId;
  jobId: mongoose.Types.ObjectId;
  status: 'pending' | 'interview' | 'offer' | 'rejected';
  appliedAt: Date;
  updatedAt: Date;
}

const ApplicationSchema: Schema = new Schema({
  candidateId: { type: Schema.Types.ObjectId, ref: 'Candidate', required: true },
  jobId: { type: Schema.Types.ObjectId, ref: 'Job', required: true },
  status: { type: String, enum: ['pending', 'interview', 'offer', 'rejected'], default: 'pending' },
  appliedAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// --- Company Model ---

export interface ICompany extends Document {
  email: string; // Identity
  name: string;
  description: string;
  industry: string;
  website?: string;
  location?: string;
  logoUrl?: string;
}

const CompanySchema: Schema = new Schema({
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String },
  industry: { type: String },
  website: { type: String },
  location: { type: String },
  logoUrl: { type: String },
});

// Avoid OverwriteModelError
export const Job: Model<IJob> = mongoose.models.Job || mongoose.model<IJob>('Job', JobSchema);
export const Candidate: Model<ICandidate> = mongoose.models.Candidate || mongoose.model<ICandidate>('Candidate', CandidateSchema);
export const Application: Model<IApplication> = mongoose.models.Application || mongoose.model<IApplication>('Application', ApplicationSchema);
export const Company: Model<ICompany> = mongoose.models.Company || mongoose.model<ICompany>('Company', CompanySchema);
