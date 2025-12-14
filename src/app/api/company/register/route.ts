import { Company } from "@/lib/db/models";
import dbConnect from "@/lib/db/mongodb";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const { email, name, description, industry, website, location } = await req.json();

    if (!email || !name) {
      return NextResponse.json(
        { error: "Email and Name are required" },
        { status: 400 }
      );
    }

    // Check if exists (defensive programming, though frontend checks too)
    const existing = await Company.findOne({ email });
    if (existing) {
      return NextResponse.json(
        { success: true, data: existing, message: "Company already exists, logged in." }
      );
    }

    const newCompany = await Company.create({
      email,
      name,
      description,
      industry,
      website,
      location
    });

    return NextResponse.json({ success: true, data: newCompany });

  } catch (error) {
    console.error("Company Register Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

