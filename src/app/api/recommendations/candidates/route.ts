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
  } catch (error: any) {
    console.error("Candidate recommendation error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
