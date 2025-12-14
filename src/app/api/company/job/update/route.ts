import { generateEmbedding } from "@/lib/ai/embedding";
import { Job } from "@/lib/db/models";
import dbConnect from "@/lib/db/mongodb";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(req: NextRequest) {
  try {
    await dbConnect();
    const { id, title, company, companyId, description, salary, location } = await req.json();

    if (!id || !title || !company || !companyId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Re-generate Embedding if description changes (optional, but good for accuracy)
    let embedding = undefined;
    if (description) {
      try {
        const textToEmbed = `Job Title: ${title}. Company: ${company}. Description: ${description}. Requirements: ${description}`;
        embedding = await generateEmbedding(textToEmbed);
      } catch (error) {
        console.error("Embedding update failed:", error);
      }
    }

    const updateData: any = {
      title,
      company,
      description,
      salary,
      location,
    };
    if (embedding) {
      updateData.embedding = embedding;
    }

    const updatedJob = await Job.findOneAndUpdate(
      { _id: id, companyId },
      { $set: updateData },
      { new: true }
    );

    if (!updatedJob) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updatedJob });

  } catch (error: any) {
    console.error("Update Job Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
