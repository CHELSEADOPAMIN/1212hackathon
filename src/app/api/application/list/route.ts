import connectToDatabase from "@/lib/db/mongodb";
import { Application } from "@/lib/db/models";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const { candidateId } = await req.json();

    if (!candidateId) {
      return NextResponse.json({ success: false, error: "Missing candidateId" }, { status: 400 });
    }

    // Find applications and populate job details
    // Note: populate requires the 'Job' model to be registered, which we ensured in models.ts
    const rawApplications = await Application.find({ candidateId })
      .populate('jobId')
      .sort({ appliedAt: -1 });

    // Filter out applications where the job no longer exists (orphaned records)
    const applications = rawApplications.filter(app => app.jobId !== null);

    return NextResponse.json({ success: true, data: applications });

  } catch (error: any) {
    console.error("List Applications Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch applications" }, { status: 500 });
  }
}
