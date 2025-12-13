import { findJobsForCandidate } from "@/lib/matching";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { profile } = await req.json();

    if (!profile) {
      return NextResponse.json({ error: "Profile data is required" }, { status: 400 });
    }

    const jobs = await findJobsForCandidate(profile);
    return NextResponse.json({ matches: jobs });
  } catch (error: any) {
    console.error("Job recommendation error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
