import { findCandidatesForJob } from "@/lib/matching";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { job } = await req.json();

    if (!job) {
      return NextResponse.json({ error: "Job data is required" }, { status: 400 });
    }

    const candidates = await findCandidatesForJob(job);
    return NextResponse.json({ matches: candidates });
  } catch (error: unknown) {
    console.error("Candidate matching error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
