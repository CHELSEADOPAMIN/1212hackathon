
import { generateEmbedding } from '../src/lib/ai/embedding';
import { findJobsForCandidate, findCandidatesForJob } from '../src/lib/matching';
import { getCollection, clientPromise } from '../src/lib/db';

async function main() {
  console.log("Starting RAG System Test...");

  if (!process.env.MONGODB_URI) {
    console.error("❌ MONGODB_URI is missing.");
    process.exit(1);
  }
  if (!process.env.OPENAI_API_KEY) {
    console.error("❌ OPENAI_API_KEY is missing.");
    process.exit(1);
  }

  const TEST_ID = "TEST_" + Date.now();
  
  // 1. Define Test Data
  const candidateData = {
    name: "Test Candidate " + TEST_ID,
    role: "Frontend Engineer",
    summary: "Experienced in React, Next.js, and TypeScript. Loves UI/UX.",
    skills: [{ name: "React", level: 90 }, { name: "Next.js", level: 85 }, { name: "TypeScript", level: 80 }],
    location: "Remote",
    email: `test_candidate_${TEST_ID}@example.com`,
    embedding: [] as number[],
    matchReason: "Test Data"
  };

  const jobData = {
    title: "Senior Frontend Developer",
    company: "Test Company " + TEST_ID,
    location: "Remote",
    type: "Full-time",
    salary: "$120k - $150k",
    description: "Looking for a React expert with Next.js experience.",
    requirements: ["React", "Next.js", "TypeScript", "Tailwind CSS"],
    postedAt: new Date(),
    embedding: [] as number[]
  };

  try {
    // 2. Generate Embeddings
    console.log("Generating embeddings...");
    
    const candidateText = [
        `Name: ${candidateData.name}`,
        `Role: ${candidateData.role}`,
        `Summary: ${candidateData.summary}`,
        `Skills: React, Next.js, TypeScript`, 
        `Location: ${candidateData.location}`
    ].join(". ");

    const jobText = [
        `Title: ${jobData.title}`,
        `Company: ${jobData.company}`,
        `Location: ${jobData.location}`,
        `Type: ${jobData.type}`,
        `Description: ${jobData.description}`,
        `Requirements: React, Next.js, TypeScript, Tailwind CSS`
    ].join(". ");

    candidateData.embedding = await generateEmbedding(candidateText);
    jobData.embedding = await generateEmbedding(jobText);

    console.log("Embeddings generated.");

    // 3. Insert Data
    console.log("Inserting test data into MongoDB...");
    const candidatesCol = await getCollection('candidates');
    const jobsCol = await getCollection('jobs');

    await candidatesCol.insertOne(candidateData);
    await jobsCol.insertOne(jobData);
    
    console.log("Test data inserted.");

    // 4. Test Candidate -> Job Matching
    console.log("\n--- Testing Find Jobs for Candidate ---");
    // Wait a moment for eventual consistency if necessary (usually instant for single insert but good practice)
    await new Promise(r => setTimeout(r, 2000));

    const matchedJobs = await findJobsForCandidate({
        role: candidateData.role,
        summary: candidateData.summary,
        skills: candidateData.skills,
        location: candidateData.location
    });

    console.log(`Found ${matchedJobs.length} jobs.`);
    const targetJobFound = matchedJobs.find(j => j.company === jobData.company);
    
    if (targetJobFound) {
        console.log(`✅ SUCCESS: Found target job "${targetJobFound.title}" with score: ${targetJobFound.score}`);
    } else {
        console.error("❌ FAILURE: Target job not found in top results.");
        console.log("Top results:", matchedJobs.map(j => ({ t: j.title, c: j.company, s: j.score })));
    }

    // 5. Test Job -> Candidate Matching
    console.log("\n--- Testing Find Candidates for Job ---");
    const matchedCandidates = await findCandidatesForJob({
        title: jobData.title,
        description: jobData.description,
        requirements: jobData.requirements,
        company: jobData.company,
        location: jobData.location,
        type: jobData.type
    });

    console.log(`Found ${matchedCandidates.length} candidates.`);
    const targetCandidateFound = matchedCandidates.find(c => c.name === candidateData.name);

    if (targetCandidateFound) {
        console.log(`✅ SUCCESS: Found target candidate "${targetCandidateFound.name}" with score: ${targetCandidateFound.score}`);
    } else {
        console.error("❌ FAILURE: Target candidate not found in top results.");
        console.log("Top results:", matchedCandidates.map(c => ({ n: c.name, r: c.role, s: c.score })));
    }

    // Cleanup
    console.log("\nCleaning up test data...");
    await candidatesCol.deleteOne({ name: candidateData.name });
    await jobsCol.deleteOne({ company: jobData.company });
    console.log("Cleanup complete.");

  } catch (error) {
    console.error("Test failed with error:", error);
  } finally {
    const client = await clientPromise;
    await client.close();
    process.exit(0);
  }
}

main();
