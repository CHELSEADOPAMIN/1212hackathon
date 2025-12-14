import mongoose, { Document, Model, Schema } from 'mongoose';

// --- Job Model ---

export interface IJob extends Document {
  title: string;
  company: string;
  companyId?: mongoose.Types.ObjectId;
  companyEmail?: string;
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
  companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
  companyEmail: { type: String },
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

// --- Interview Model ---

export interface IInterview extends Document {
  matchId: mongoose.Types.ObjectId | string;
  questions: string[];
  status: 'scheduled' | 'completed';
  recordingUrl?: string;
  createdAt: Date;
}

const InterviewSchema: Schema = new Schema(
  {
    // Mixed type keeps compatibility with ObjectId and mock string IDs
    matchId: { type: Schema.Types.Mixed, required: true, index: true },
    questions: {
      type: [String],
      default: [],
      validate: {
        validator: (arr: string[]) => Array.isArray(arr) && arr.length > 0,
        message: 'At least one question is required',
      },
    },
    status: { type: String, enum: ['scheduled', 'completed'], default: 'scheduled' },
    recordingUrl: { type: String },
  },
  {
    timestamps: { createdAt: true, updatedAt: true },
  }
);

// Avoid OverwriteModelError
export const Job: Model<IJob> = mongoose.models.Job || mongoose.model<IJob>('Job', JobSchema);
export const Candidate: Model<ICandidate> = mongoose.models.Candidate || mongoose.model<ICandidate>('Candidate', CandidateSchema);
export const Company: Model<ICompany> = mongoose.models.Company || mongoose.model<ICompany>('Company', CompanySchema);
export const Interview: Model<IInterview> = mongoose.models.Interview || mongoose.model<IInterview>('Interview', InterviewSchema);
