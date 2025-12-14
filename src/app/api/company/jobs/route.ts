import { Job } from "@/lib/db/models";
import dbConnect from "@/lib/db/mongodb";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get('companyId');

    if (!companyId) {
      return NextResponse.json(
        { error: "companyId is required" },
        { status: 400 }
      );
    }

    const jobs = await Job.find({ companyId }).sort({ postedAt: -1 });

    return NextResponse.json({ success: true, data: jobs });
  } catch (error: any) {
    console.error("Fetch Jobs Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

