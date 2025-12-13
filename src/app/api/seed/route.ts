import { generateEmbedding } from "@/lib/ai/embedding";
import { getCollection } from "@/lib/db";
import { buildCandidateProfileText, buildJobProfileText } from "@/lib/matching";
import { Candidate, Job } from "@/lib/types";
import { NextResponse } from "next/server";

// Mock Data
const MOCK_JOBS = [
  {
    title: 'Senior Frontend Engineer',
    company: 'TechFlow',
    location: 'San Francisco, CA (Remote)',
    type: 'Full-time',
    salary: '$160k - $220k',
    description: 'We are looking for a Senior Frontend Engineer to lead our core product team. You will be working with React, Next.js, and TypeScript to build performant and accessible user interfaces.',
    requirements: ['5+ years React experience', 'Deep understanding of Next.js App Router', 'Experience with Tailwind CSS', 'Strong TypeScript skills'],
  },
  {
    title: 'AI/ML Engineer',
    company: 'NeuralNet',
    location: 'New York, NY',
    type: 'Full-time',
    salary: '$180k - $250k',
    description: 'Join our AI research team to build the next generation of LLM-powered applications. You will work on fine-tuning models and building RAG pipelines.',
    requirements: ['Experience with PyTorch or TensorFlow', 'Knowledge of LLMs and RAG', 'Python proficiency', 'Experience with vector databases'],
  },
  {
    title: 'Full Stack Developer',
    company: 'StartUp Inc',
    location: 'Austin, TX',
    type: 'Contract',
    salary: '$80 - $120 / hr',
    description: 'Looking for a versatile full stack developer to help us ship our MVP. You should be comfortable touching all parts of the stack, from database design to UI implementation.',
    requirements: ['React/Node.js experience', 'MongoDB or PostgreSQL', 'AWS knowledge', 'Startup mindset'],
  },
  {
    title: 'DevOps Engineer',
    company: 'CloudScale',
    location: 'Remote',
    type: 'Full-time',
    salary: '$150k - $200k',
    description: 'We need a DevOps engineer to manage our Kubernetes clusters and CI/CD pipelines. You will be responsible for ensuring high availability and scalability.',
    requirements: ['Kubernetes mastery', 'Terraform', 'CI/CD (GitHub Actions/CircleCI)', 'AWS/GCP'],
  },
  {
    title: 'Product Designer',
    company: 'Creative Studio',
    location: 'Los Angeles, CA',
    type: 'Full-time',
    salary: '$130k - $170k',
    description: 'We are looking for a talented Product Designer to create beautiful and intuitive user experiences. You will work closely with PMs and engineers.',
    requirements: ['Figma expert', 'Strong UX/UI portfolio', 'Experience with design systems', 'Prototyping skills'],
  }
];

const MOCK_CANDIDATES = [
  {
    name: 'Alice Chen',
    role: 'Frontend Specialist',
    summary: 'Passionate frontend developer with a focus on user experience and performance. I love building polished UIs with React and Tailwind.',
    skills: [
      { name: 'React', level: 95, category: 'Frontend' },
      { name: 'TypeScript', level: 90, category: 'Languages' },
      { name: 'Next.js', level: 85, category: 'Frontend' },
      { name: 'Tailwind CSS', level: 90, category: 'Styling' },
    ],
    email: 'alice@example.com',
  },
  {
    name: 'Bob Smith',
    role: 'Backend Engineer',
    summary: 'Experienced backend engineer with a strong background in distributed systems and cloud infrastructure. I enjoy optimizing database queries and building scalable APIs.',
    skills: [
      { name: 'Node.js', level: 90, category: 'Backend' },
      { name: 'Python', level: 80, category: 'Languages' },
      { name: 'MongoDB', level: 85, category: 'Database' },
      { name: 'AWS', level: 75, category: 'Cloud' },
    ],
    email: 'bob@example.com',
  },
  {
    name: 'Charlie Davis',
    role: 'Full Stack Developer',
    summary: 'Versatile developer comfortable with both frontend and backend technologies. I consider myself a generalist who can pick up new tools quickly.',
    skills: [
      { name: 'JavaScript', level: 90, category: 'Languages' },
      { name: 'React', level: 80, category: 'Frontend' },
      { name: 'Node.js', level: 80, category: 'Backend' },
      { name: 'PostgreSQL', level: 75, category: 'Database' },
    ],
    email: 'charlie@example.com',
  }
];

export async function POST() {
  try {
    const jobsCollection = await getCollection<Job>('jobs');
    const candidatesCollection = await getCollection<Candidate>('candidates');

    // Clear existing data (Optional: comment out if you want to keep adding)
    await jobsCollection.deleteMany({});
    await candidatesCollection.deleteMany({});

    // Seed Jobs
    const jobDocs: Job[] = [];
    for (const job of MOCK_JOBS) {
      const textToEmbed = buildJobProfileText(job);
      const embedding = await generateEmbedding(textToEmbed);
      jobDocs.push({ ...job, postedAt: new Date(), embedding });
    }
    if (jobDocs.length) {
      await jobsCollection.insertMany(jobDocs);
    }

    // Seed Candidates
    const candidateDocs: Candidate[] = [];
    for (const candidate of MOCK_CANDIDATES) {
      const textToEmbed = buildCandidateProfileText(candidate);
      const embedding = await generateEmbedding(textToEmbed);
      candidateDocs.push({ ...candidate, embedding });
    }
    if (candidateDocs.length) {
      await candidatesCollection.insertMany(candidateDocs);
    }

    return NextResponse.json({
      success: true,
      message: `Seeded ${jobDocs.length} jobs and ${candidateDocs.length} candidates.`,
    });
  } catch (error: any) {
    console.error('Seeding error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
