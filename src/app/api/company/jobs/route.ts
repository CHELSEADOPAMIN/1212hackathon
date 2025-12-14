import { Job } from "@/lib/db/models";
import dbConnect from "@/lib/db/mongodb";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    // In a real app, filtering by companyId would be done here
    // const { searchParams } = new URL(req.url);
    // const companyId = searchParams.get('companyId');

    const jobs = await Job.find({}).sort({ postedAt: -1 });

    return NextResponse.json({ success: true, data: jobs });
  } catch (error: any) {
    console.error("Fetch Jobs Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

