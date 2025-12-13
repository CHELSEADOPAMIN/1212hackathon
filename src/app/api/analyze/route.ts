import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// 初始化 Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  try {
    const { githubUrl } = await req.json();

    // 为了演示速度，我们使用 gemini-1.5-flash，它最快且免费
    // 1.5 模型只在 v1 提供，显式使用 v1 以避免 v1beta 的 404
    const model = genAI.getGenerativeModel(
      { model: "gemini-pro" },
      { apiVersion: "v1" }
    );

    // 这是核心 Prompt，让它假装是一个爬虫
    const prompt = `
      You are a tech recruiter system. 
      I will give you a GitHub URL: "${githubUrl}".
      
      Since you cannot browse the live internet, I want you to HALLUCINATE (simulate) a realistic profile based on the username in the URL.
      
      Generate a realistic candidate profile in JSON format with the following fields:
      1. "name": A realistic name based on the username.
      2. "role": Suggested job title (e.g. Senior Frontend Engineer).
      3. "summary": A 2-sentence professional summary (in Chinese).
      4. "skills": An array of 5 objects for a radar chart. Each object must have "subject" (skill name) and "A" (score 0-100). 
         Example: [{"subject": "React", "A": 90}, {"subject": "Node.js", "A": 80}...]
      5. "matchReason": A one-line reason why they are a top talent (in Chinese).

      RETURN ONLY THE RAW JSON. DO NOT USE MARKDOWN BLOCK.
    `;

    const result = await model.generateContent(prompt);
    const response = result.response;
    let text = response.text();

    // 清理一下 Gemini 可能返回的 Markdown 格式 (```json ... ```)
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();

    const data = JSON.parse(text);

    return NextResponse.json({ success: true, data });

  } catch (error) {
    console.error("Gemini API Error:", error);
    return NextResponse.json({ success: false, error: "Failed to analyze profile" }, { status: 500 });
  }
}
