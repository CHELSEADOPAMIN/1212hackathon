import { generateEmbedding } from "@/lib/ai/embedding";
import { Job } from "@/lib/db/models";
import dbConnect from "@/lib/db/mongodb";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const { title, company, companyId, description, salary, location, email } = await req.json();

    if (!title || !company || !companyId || !description) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Generate Embedding
    let embedding: number[] = [];
    try {
      // 组合关键信息进行 Embedding
      const textToEmbed = `Job Title: ${title}. Company: ${company}. Description: ${description}. Requirements: ${description}`; // 简化处理，把描述也当需求
      embedding = await generateEmbedding(textToEmbed);
    } catch (error) {
      console.error("Embedding generation failed:", error);
      // Fallback: 生成一个全 0 向量，防止保存失败 (1536 维是 text-embedding-3-small 的默认维度)
      embedding = new Array(1536).fill(0);
    }

    const newJob = await Job.create({
      title,
      company,
      companyId,
      description,
      salary: salary || "Competitive",
      location: location || "Remote",
      type: "Full-time", // 默认
      requirements: [], // 暂时留空，或者从描述中提取
      postedAt: new Date(),
      embedding,
      companyEmail: email, // 关联公司
    });

    return NextResponse.json({ success: true, data: newJob });

  } catch (error: unknown) {
    console.error("Save Job Error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
