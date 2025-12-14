import { NextResponse } from "next/server";
import OpenAI from "openai";

// 初始化 OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface Repo {
  name: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  fork: boolean;
  created_at: string;
  pushed_at: string;
}

export async function POST(req: Request) {
  try {
    const { githubUrl, resumeText } = await req.json();

    // 1. 提取用户名 (简单正则: github.com/username)
    const match = githubUrl.match(/github\.com\/([^\/]+)/);
    const username = match ? match[1] : null;

    if (!username) {
      return NextResponse.json({ success: false, error: "Invalid GitHub URL" }, { status: 400 });
    }

    // 2. 调用 GitHub API 获取仓库列表 (按更新时间排序，最多 100 个)
    // 注意：如果没有 GITHUB_TOKEN，可能会有限流风险。建议在 .env.local 中配置。
    const headers: HeadersInit = {
      "Accept": "application/vnd.github.v3+json",
    };
    if (process.env.GITHUB_TOKEN) {
      headers["Authorization"] = `Bearer ${process.env.GITHUB_TOKEN}`;
    }

    const ghRes = await fetch(`https://api.github.com/users/${username}/repos?sort=pushed&per_page=100`, {
      headers,
      next: { revalidate: 60 } // 缓存 60s
    });

    let repos: Repo[] = [];
    if (ghRes.ok) {
      repos = await ghRes.json();
    } else {
      console.warn("GitHub API Limit or Error, fallback to simulation mode.");
      // 如果 API 失败（比如限流），我们继续往下，依靠 AI "Hallucinate" (原来的逻辑)，
      // 或者在这里抛出错误。为了演示稳定性，我们把 repos 留空，让 Prompt 处理空数据的情况。
    }

    // 3. 智能清洗 (Filter & Analyze)
    const validRepos = repos.filter(repo => {
      // 逻辑 A: 原创项目 -> 保留
      if (!repo.fork) return true;

      // 逻辑 B: 有效 Fork (时间差判定法)
      const created = new Date(repo.created_at).getTime();
      const pushed = new Date(repo.pushed_at).getTime();
      const diffMinutes = (pushed - created) / (1000 * 60);

      // 如果 Fork 后 10 分钟内有 Push，或者 Star 数 > 0 (说明 Fork 本身有价值)，视为有效贡献
      return diffMinutes > 10 || repo.stargazers_count > 0;
    }).slice(0, 15); // 只取前 15 个最活跃的，避免 Prompt 过长

    // 格式化给 AI 的数据摘要
    const repoSummary = validRepos.map(r => ({
      name: r.name,
      type: r.fork ? "Contribution (Fork)" : "Original",
      lang: r.language || "Misc",
      stars: r.stargazers_count,
      desc: r.description ? r.description.slice(0, 100) : "No description"
    }));

    // 4. 构建 Prompt
    
    // I will replace the top part first.
    
    const prompt = `
      You are an expert AI Tech Recruiter. I will give you data about a candidate's GitHub repositories and their Resume content.
      
      Candidate Username: "${username}"
      GitHub URL: "${githubUrl}"
      Resume Content:
      """
      ${resumeText || "No resume provided."}
      """
      
      Analyzed Repositories (Top 15 Active & Valid):
      ${JSON.stringify(repoSummary, null, 2)}
      
      Tasks:
      1. Analyze their tech stack based on the "lang" field, project descriptions, and Resume.
         - Give higher weight to "Original" projects.
         - If they have active "Contribution (Fork)" projects, acknowledge them as an "Open Source Contributor".
      2. Extract ALL Professional Experience from the Resume. Do not skip any role.
      3. For each experience entry, generate a detailed description of AT LEAST 3 bullet points or sentences, summarizing their key achievements, technologies used, and impact.
      4. Generate a realistic candidate profile in JSON.

      Output JSON Format:
      {
        "name": "Realistic Name based on username or resume",
        "role": "Suggested Job Title (e.g. Senior Frontend Engineer)",
        "summary": "2-sentence professional summary in English. Mention their open source contributions if any.",
        "skills": [
          {"subject": "Skill1", "A": 90}, 
          {"subject": "Skill2", "A": 85}, 
          {"subject": "Skill3", "A": 80}, 
          {"subject": "Skill4", "A": 75}, 
          {"subject": "Skill5", "A": 70}
        ],
        "experiences": [
          {
            "role": "Job Title",
            "company": "Company Name",
            "period": "e.g. 2021 - Present",
            "description": "Detailed summary (at least 3 lines/sentences)..."
          }
        ],
        "matchReason": "A one-line reason why they are a top talent (in English)."
      }

      RETURN ONLY THE RAW JSON. NO MARKDOWN.
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-5.1", // Updated to gpt-5.1 as requested
      messages: [
        { role: "system", content: "You are a helpful assistant that outputs raw JSON." },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
    });

    let text = completion.choices[0].message.content || "{}";
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const data = JSON.parse(text);

    return NextResponse.json({ success: true, data });

  } catch (error) {
    console.error("Analysis Error:", error);
    return NextResponse.json({ success: false, error: "Failed to analyze profile" }, { status: 500 });
  }
}
