import { generateEmbedding } from "@/lib/ai/embedding";
import { Candidate } from "@/lib/db/models";
import connectToDatabase from "@/lib/db/mongodb";
import { buildCandidateProfileText } from "@/lib/matching";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    // 1. Connect to DB
    await connectToDatabase();

    // 2. Parse Body
    const body = await req.json();
    const { name, role, summary, skills, experiences, matchReason, githubUrl } = body;

    // 3. Validate
    if (!name || !role || !summary || !skills) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    // 4. Map skills format
    // Frontend: { subject: string; A: number }[]
    // DB: { name: string; level: number; category?: string }[]
    const formattedSkills = skills.map((s: any) => ({
      name: s.subject || s.name,
      level: s.A || s.level,
      category: "General"
    }));

    // 5. Generate text for embedding
    const textToEmbed = buildCandidateProfileText({
      name,
      role,
      summary,
      skills: formattedSkills,
      experiences: experiences // Pass experiences to builder
    });
    
    // 6. Generate embedding
    const embedding = await generateEmbedding(textToEmbed);

    // 7. Upsert Candidate
    // Using findOneAndUpdate to upsert if githubUrl is present
    let candidate;
    if (githubUrl) {
       candidate = await Candidate.findOneAndUpdate(
        { githubUrl },
        {
          name,
          role,
          summary,
          skills: formattedSkills,
          experiences,
          matchReason,
          embedding,
          // Update postedAt or updatedAt if we had those fields
        },
        { new: true, upsert: true }
      );
    } else {
      candidate = await Candidate.create({
        name,
        role,
        summary,
        skills: formattedSkills,
        experiences,
        matchReason,
        githubUrl,
        embedding
      });
    }

    return NextResponse.json({ success: true, data: candidate });

  } catch (error: any) {
    console.error("Save Candidate Error:", error);
    return NextResponse.json({ success: false, error: "Failed to save candidate" }, { status: 500 });
  }
}