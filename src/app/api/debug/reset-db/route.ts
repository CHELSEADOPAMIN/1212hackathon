import { Application, Candidate, Company, Job } from "@/lib/db/models";
import dbConnect from "@/lib/db/mongodb";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    await dbConnect();

    await Candidate.deleteMany({});
    await Company.deleteMany({});
    await Job.deleteMany({});
    await Application.deleteMany({});

    return NextResponse.json({ success: true, message: "All data cleared." });
  } catch (error) {
    console.error("Reset DB Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
