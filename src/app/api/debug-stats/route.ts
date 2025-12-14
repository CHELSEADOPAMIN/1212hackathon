import { getCollection } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const jobsCollection = await getCollection('jobs');
    const candidatesCollection = await getCollection('candidates');

    const jobsCount = await jobsCollection.countDocuments();
    const candidatesCount = await candidatesCollection.countDocuments();

    return NextResponse.json({
      jobs: jobsCount,
      candidates: candidatesCount,
      database: process.env.MONGODB_DB || 'lyrathon'
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}



