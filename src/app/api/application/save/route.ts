import connectToDatabase from "@/lib/db/mongodb";
import { Application } from "@/lib/db/models";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const { candidateId, jobId } = await req.json();

    if (!candidateId || !jobId) {
      return NextResponse.json({ success: false, error: "Missing candidateId or jobId" }, { status: 400 });
    }

    // Check for existing application to prevent duplicates
    const existing = await Application.findOne({ candidateId, jobId });
    if (existing) {
      return NextResponse.json({ success: true, message: "Already applied", data: existing });
    }

    const application = await Application.create({
      candidateId,
      jobId,
      status: 'pending'
    });

    return NextResponse.json({ success: true, data: application });

  } catch (error: any) {
    console.error("Save Application Error:", error);
    return NextResponse.json({ success: false, error: "Failed to save application" }, { status: 500 });
  }
}
