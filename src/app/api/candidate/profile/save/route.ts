import { Candidate } from "@/lib/db/models";
import dbConnect from "@/lib/db/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { OpenAI } from "openai";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function getEmbedding(text: string) {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
      encoding_format: "float",
    });
    return response.data[0].embedding;
  } catch (error) {
    console.error("Error generating embedding:", error);
    // Return a zero vector or throw depending on requirements
    // For now, throwing to ensure we don't save invalid data
    throw error;
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();

    // Validate required fields
    if (!body.name || !body.role || !body.skills || !body.email) {
      return NextResponse.json(
        { error: "Missing required fields (name, role, skills, email)" },
        { status: 400 }
      );
    }

    // Generate embedding for vector search
    // Combine role, summary, and skills into a rich text representation
    const skillText = body.skills.map((s: any) => `${s.name} (${s.level})`).join(", ");
    const textToEmbed = `Role: ${body.role}. Summary: ${body.summary}. Skills: ${skillText}.`;

    console.log("-> Generating embedding for candidate:", body.email);

    let embedding;
    try {
      embedding = await getEmbedding(textToEmbed);
      console.log("-> Embedding generated successfully, length:", embedding?.length);
    } catch (e: any) {
      console.error("-> OpenAI Embedding Failed:", e.message);
      return NextResponse.json(
        { error: `OpenAI Embedding Failed: ${e.message}` },
        { status: 500 }
      );
    }

    // Prepare candidate data
    console.log("-> Preparing to save to MongoDB...");
    const candidateData = {
      name: body.name,
      role: body.role,
      summary: body.summary,
      // Map skills from UI format (subject, A) to Schema format (name, level)
      // handling both potential input formats for robustness
      skills: body.skills.map((s: any) => ({
        name: s.subject || s.name,
        level: s.A || s.level,
        category: s.category || 'General'
      })),
      experiences: body.experiences || [],
      email: body.email,
      githubUrl: body.githubUrl,
      matchReason: body.matchReason,
      embedding: embedding
    };

    // UPSERT: Update if exists, Insert if not
    const savedCandidate = await Candidate.findOneAndUpdate(
      { email: body.email },
      candidateData,
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    console.log("-> MongoDB Save Success. ID:", savedCandidate._id);

    return NextResponse.json({ success: true, data: savedCandidate });

  } catch (error: any) {
    console.error("-> Save Profile Error (Catch Block):", error);
    return NextResponse.json(
      { error: `Internal Server Error: ${error.message}` },
      { status: 500 }
    );
  }
}
