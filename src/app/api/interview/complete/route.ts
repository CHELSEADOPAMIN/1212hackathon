import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { promises as fs } from "fs";

import dbConnect from "@/lib/db/mongodb";
import { Interview } from "@/lib/db/models";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const interviewId = formData.get("interviewId");
    const file = formData.get("file");

    if (!interviewId || !(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: "interviewId and video file are required" },
        { status: 400 }
      );
    }

    await dbConnect();
    const interview = await Interview.findById(interviewId);
    if (!interview) {
      return NextResponse.json({ success: false, error: "Interview not found" }, { status: 404 });
    }

    const uploadsDir = path.join(process.cwd(), "public", "uploads", "interviews");
    await fs.mkdir(uploadsDir, { recursive: true });

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const targetPath = path.join(uploadsDir, `${interviewId}.webm`);
    await fs.writeFile(targetPath, buffer);

    interview.status = "completed";
    interview.recordingUrl = `/uploads/interviews/${interviewId}.webm`;
    await interview.save();

    return NextResponse.json({
      success: true,
      data: {
        recordingUrl: interview.recordingUrl,
        interviewId: interview._id.toString(),
      },
    });
  } catch (error: unknown) {
    console.error("Complete interview error:", error);
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
