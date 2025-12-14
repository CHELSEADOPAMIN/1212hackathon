import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({
    success: false,
    message: "Seeding is disabled. Mock data has been removed from the codebase.",
  });
}
