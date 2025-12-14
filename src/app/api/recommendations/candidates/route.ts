import { DEFAULT_COMPANY_ID } from "@/lib/constants";
import { Job } from "@/lib/db/models";
import dbConnect from "@/lib/db/mongodb";
import { getMatchesCollection } from "@/lib/matches";
import { findCandidatesForJob } from "@/lib/matching";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();
    let job = body.job;
    const { jobId } = body;

    // 如果没有传完整的 job 对象，但传了 jobId，尝试从数据库查询
    if (!job && jobId) {
      job = await Job.findById(jobId);
    }

    if (!job) {
      return NextResponse.json({ error: "Job data or valid Job ID is required" }, { status: 400 });
    }

    // 1. Get list of candidate IDs that have been interacted with
    const matchesCollection = await getMatchesCollection();

    // Use passed jobId and assumed companyId (or get from Job)
    // Note: Here we assume companyId is DEFAULT_COMPANY_ID, or passed from request.
    // In real scenarios, should get Company ID from Session or Token.
    const companyId =
      body.companyId ||
      job?.companyId?.toString?.() ||
      DEFAULT_COMPANY_ID; // 或者 job.companyId (如果 schema 有)

    // 查找该职位所有已滑过的记录 (无论 like 还是 reject)
    const existingMatches = await matchesCollection
      .find({
        jobId: jobId?.toString() || job?._id?.toString?.(),
        companyId: companyId // 确保只过滤当前公司的互动
      })
      .project({ candidateId: 1 })
      .toArray();

    const excludeIds = existingMatches.map(m => m.candidateId.toString());

    // 2. 查找推荐候选人，并排除已互动的
    const candidates = await findCandidatesForJob(job, excludeIds);

    return NextResponse.json({ matches: candidates });
  } catch (error: unknown) {
    console.error("Candidate recommendation error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
