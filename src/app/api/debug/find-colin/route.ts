import { Candidate } from "@/lib/db/models";
import dbConnect from "@/lib/db/mongodb";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    // 模糊搜索 Colin
    const candidates = await Candidate.find({ name: { $regex: /colin/i } });

    if (!candidates || candidates.length === 0) {
      return NextResponse.json({ found: false, message: "No candidate found named Colin" });
    }

    return NextResponse.json({
      found: true,
      count: candidates.length,
      candidates: candidates.map(c => ({
        id: c._id,
        name: c.name,
        role: c.role,
        hasEmbedding: !!c.embedding && c.embedding.length > 0,
        embeddingLength: c.embedding ? c.embedding.length : 0,
        email: c.email
      }))
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
