import { generateEmbedding } from "@/lib/ai/embedding";
import { getCollection } from "@/lib/db";
import { buildJobProfileText } from "@/lib/matching";
import { Job } from "@/lib/types";
import connectToDatabase from "@/lib/db/mongodb";

// Diverse Mock Jobs
const DIVERSE_JOBS = [
  // 1. High-Level Java Backend (Enterprise)
  {
    title: 'Principal Java Backend Engineer',
    company: 'Enterprise Bank Corp',
    location: 'Chicago, IL',
    type: 'Full-time',
    salary: '$180k - $240k',
    description: 'Seeking a veteran Java engineer to architect our next-gen payment processing system. Must have deep experience with Spring Boot, Microservices, and high-concurrency systems.',
    requirements: ['Expert in Java 17+', 'Spring Boot & Spring Cloud', 'Kafka / RabbitMQ', 'Oracle / PostgreSQL', 'System Design'],
  },
  // 2. Vue.js Frontend (Creative Agency)
  {
    title: 'Senior Frontend Developer (Vue.js)',
    company: 'PixelPerfect Agency',
    location: 'Remote (Europe/US)',
    type: 'Contract',
    salary: '$100 - $150 / hr',
    description: 'We need a creative frontend developer to build stunning interactive websites for our luxury clients. You will work closely with designers to implement complex animations.',
    requirements: ['Vue 3 (Composition API)', 'Nuxt.js', 'GSAP / Three.js', 'SCSS / Tailwind', 'Pixel-perfect attention to detail'],
  },
  // 3. DevOps / SRE (Cloud Native)
  {
    title: 'Site Reliability Engineer',
    company: 'CloudNative SaaS',
    location: 'Seattle, WA',
    type: 'Full-time',
    salary: '$160k - $210k',
    description: 'Ensure our global SaaS platform runs smoothly. You will be automating infrastructure using Terraform and managing Kubernetes clusters at scale.',
    requirements: ['Kubernetes (CKA preferred)', 'Terraform / Ansible', 'Golang or Python scripting', 'Prometheus & Grafana', 'AWS / GCP'],
  },
  // 4. Product Manager (Non-Technical focus)
  {
    title: 'Senior Product Manager',
    company: 'GrowthHack Startup',
    location: 'San Francisco, CA',
    type: 'Full-time',
    salary: '$170k - $220k',
    description: 'Lead the roadmap for our consumer mobile app. You will define features, analyze user metrics, and work with engineering to deliver value.',
    requirements: ['5+ years Product Management', 'Data Analysis (SQL/Amplitude)', 'User Research', 'A/B Testing', 'Agile/Scrum'],
  },
  // 5. Junior Python Developer (Data focus)
  {
    title: 'Junior Python Data Engineer',
    company: 'DataInsights',
    location: 'Austin, TX',
    type: 'Full-time',
    salary: '$90k - $120k',
    description: 'Great opportunity for a junior engineer to learn data engineering. You will help build ETL pipelines and maintain our data warehouse.',
    requirements: ['Python proficiency', 'SQL knowledge', 'Basic understanding of ETL', 'Eager to learn Airflow/Spark'],
  },
   // 6. Mobile Developer (iOS/Swift)
  {
    title: 'iOS Engineer',
    company: 'AppMaster',
    location: 'Remote',
    type: 'Full-time',
    salary: '$140k - $190k',
    description: 'Build the next version of our award-winning iOS app. We value clean architecture and native performance.',
    requirements: ['Swift & SwiftUI', 'Combine / RxSwift', 'Core Data', 'Unit Testing', 'Published apps on App Store'],
  }
];

async function seed() {
  console.log("Starting seed process...");
  try {
    await connectToDatabase();
    const jobsCollection = await getCollection<Job>('jobs');

    console.log("Generating embeddings for new jobs...");
    const jobDocs: Job[] = [];
    
    for (const job of DIVERSE_JOBS) {
      console.log(`Processing: ${job.title}`);
      const textToEmbed = buildJobProfileText(job);
      const embedding = await generateEmbedding(textToEmbed);
      jobDocs.push({ ...job, postedAt: new Date(), embedding });
    }

    if (jobDocs.length) {
      const result = await jobsCollection.insertMany(jobDocs);
      console.log(`✅ Successfully added ${result.insertedCount} diverse jobs.`);
    } else {
      console.log("No jobs to add.");
    }

  } catch (error) {
    console.error('Seeding error:', error);
  } finally {
    process.exit(0);
  }
}

seed();
