import { getCollection } from "@/lib/db";
import { Candidate, Job } from "@/lib/db/models";
import dbConnect from "@/lib/db/mongodb";
import { NextRequest, NextResponse } from "next/server";

// 简单的余弦相似度计算函数
function cosineSimilarity(vecA: number[], vecB: number[]) {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    // 1. 获取最新的 Job 和 Candidate
    const job = await Job.findOne({}).sort({ postedAt: -1 });
    const candidate = await Candidate.findOne({}).sort({ _id: -1 });

    if (!job || !candidate) {
      return NextResponse.json({
        success: false,
        message: "Missing data",
        hasJob: !!job,
        hasCandidate: !!candidate
      });
    }

    // 2. 检查 Embedding 是否存在
    const jobEmbedding = job.embedding;
    const candEmbedding = candidate.embedding;

    if (!jobEmbedding || jobEmbedding.length === 0 || !candEmbedding || candEmbedding.length === 0) {
      return NextResponse.json({
        success: false,
        message: "Missing embeddings",
        jobEmbeddingLength: jobEmbedding?.length,
        candEmbeddingLength: candEmbedding?.length
      });
    }

    // 3. 内存计算相似度 (验证 AI 部分)
    const similarity = cosineSimilarity(jobEmbedding, candEmbedding);

    // 4. 尝试 MongoDB Vector Search (验证 DB Index 部分)
    let dbSearchResult = null;
    let dbSearchError = null;
    try {
      const collection = await getCollection("candidates");
      const pipeline = [
        {
          $vectorSearch: {
            index: "vector_index", // 假设索引名为 vector_index
            path: "embedding",
            queryVector: jobEmbedding,
            numCandidates: 10,
            limit: 1,
          },
        },
        {
          $project: {
            name: 1,
            score: { $meta: "vectorSearchScore" },
          },
        },
      ];
      dbSearchResult = await collection.aggregate(pipeline).toArray();
    } catch (e: any) {
      dbSearchError = e.message;
    }

    return NextResponse.json({
      success: true,
      analysis: {
        job: { title: job.title, company: job.company },
        candidate: { name: candidate.name, role: candidate.role },
        directSimilarity: similarity, // 这是真实的语义相似度
        dbSearch: {
          worked: !dbSearchError && dbSearchResult && dbSearchResult.length > 0,
          result: dbSearchResult, // 如果这里为空，说明 Atlas Search Index 没配好
          error: dbSearchError
        },
        conclusion: similarity > 0.7
          ? "Semantic match is strong. AI is working."
          : "Semantic match is weak. Content might be unrelated.",
        indexAdvice: dbSearchError || (dbSearchResult && dbSearchResult.length === 0)
          ? "MongoDB Vector Search failed to return results. Please check Atlas Search Index configuration."
          : "Vector Search is working."
      }
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

