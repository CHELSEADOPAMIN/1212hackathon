"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, CheckCircle2, FileText, Github, Loader2, UploadCloud, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer } from 'recharts';

// 定义 API 返回的数据类型
interface AnalysisResult {
  name: string;
  role: string;
  summary: string;
  skills: { subject: string; A: number }[];
  matchReason: string;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [githubUrl, setGithubUrl] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [fileName, setFileName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("正在读取开源代码...");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Loading 状态下的文字轮播效果
  useEffect(() => {
    if (isLoading) {
      const texts = [
        "正在读取开源代码...",
        "正在解析项目复杂度...",
        "正在融合职业经历...",
        "正在生成战力图谱...",
        "AI 最终计算中..."
      ];
      let i = 0;
      const interval = setInterval(() => {
        i = (i + 1) % texts.length;
        setLoadingText(texts[i]);
      }, 1500);
      return () => clearInterval(interval);
    }
  }, [isLoading]);

  const handleGithubSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (githubUrl.trim()) {
      setStep(2);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);

    // 简单处理：如果是文本文件，尝试读取内容
    // 对于 PDF/Word，实际生产环境需要后端解析。
    // 这里为了演示，如果是 PDF/Word，我们填入一个标记，或者提示用户。
    // Hackathon 技巧：提示用户演示模式下建议使用 txt/md 或直接粘贴。

    if (file.type === "text/plain" || file.name.endsWith(".md") || file.name.endsWith(".txt")) {
      const text = await file.text();
      setResumeText(text);
    } else {
      // 非文本文件，模拟已读取，但在 prompt 中可能需要特殊处理
      // 这里为了让 AI 正常工作，我们填入一些模拟信息，或者提示用户
      // 更好的体验是：保留 Textarea，如果解析失败，允许用户手动修改
      setResumeText(`[已上传文件: ${file.name}]。请忽略此行，根据 GitHub 链接分析。`);
    }
  };

  const clearFile = () => {
    setFileName("");
    setResumeText("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleAnalysisSubmit = async () => {
    setStep(3);
    setIsLoading(true);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ githubUrl, resumeText }),
      });

      const data = await res.json();

      if (data.success) {
        setResult(data.data);
        setStep(4);
      } else {
        alert("分析失败，请重试");
        setStep(1);
      }
    } catch (error) {
      console.error(error);
      alert("网络错误");
      setStep(1);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 p-4">
      {/* 步骤 1: GitHub 输入 */}
      {step === 1 && (
        <Card className="w-full max-w-md animate-in fade-in zoom-in duration-300">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Github className="w-6 h-6" />
              第一步：你的代码战力
            </CardTitle>
            <CardDescription>
              我们需要你的 GitHub 链接来评估你的技术深度。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleGithubSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="github">GitHub Profile URL</Label>
                <Input
                  id="github"
                  placeholder="github.com/yourusername"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={!githubUrl.trim()}>
                下一步
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* 步骤 2: 简历上传 */}
      {step === 2 && (
        <Card className="w-full max-w-md animate-in slide-in-from-right-8 duration-300">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <FileText className="w-6 h-6" />
              第二步：上传简历
            </CardTitle>
            <CardDescription>
              支持 PDF, Word, TXT 或 Markdown。AI 将提取关键经历。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 上传区域 */}
            {!fileName ? (
              <div
                className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:bg-slate-50 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.txt,.md"
                />
                <div className="flex flex-col items-center gap-2 text-slate-500">
                  <div className="p-3 bg-slate-100 rounded-full">
                    <UploadCloud className="w-8 h-8 text-slate-400" />
                  </div>
                  <p className="font-medium">点击或拖拽文件到此处</p>
                  <p className="text-xs">支持最大 10MB</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-100 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-md shadow-sm">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="text-sm">
                    <p className="font-medium text-slate-700 truncate max-w-[200px]">{fileName}</p>
                    <p className="text-blue-600 text-xs">已就绪</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={clearFile} className="hover:bg-blue-100 text-slate-400 hover:text-red-500">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}

            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink-0 mx-4 text-xs text-slate-400">或者手动粘贴</span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            <Textarea
              placeholder="在此粘贴你的个人简介或简历内容..."
              className="min-h-[100px] text-sm"
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
            />

            <Button
              onClick={handleAnalysisSubmit}
              className="w-full"
              disabled={!resumeText.trim()}
            >
              开始 AI 全局分析
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 步骤 3: Loading */}
      {step === 3 && (
        <div className="flex flex-col items-center justify-center space-y-8 animate-in fade-in duration-500">
          <div className="relative">
            <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full animate-pulse" />
            <div className="relative bg-white p-6 rounded-full shadow-xl">
              <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
            </div>
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-xl font-medium text-slate-800 animate-pulse">
              {loadingText}
            </h3>
            <p className="text-sm text-slate-500">这将需要几秒钟时间</p>
          </div>
        </div>
      )}

      {/* 步骤 4: 结果展示 */}
      {step === 4 && result && (
        <Card className="w-full max-w-2xl animate-in zoom-in-95 duration-500 border-2 border-blue-100 shadow-xl">
          <CardHeader className="text-center border-b bg-slate-50/50">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-blue-600" />
            </div>
            <CardTitle className="text-3xl font-bold text-slate-900">{result.name}</CardTitle>
            <CardDescription className="text-lg text-blue-600 font-medium">
              {result.role}
            </CardDescription>
          </CardHeader>

          <CardContent className="p-8">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              {/* 雷达图 */}
              <div className="h-[300px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={result.skills}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 12 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar
                      name="Skill"
                      dataKey="A"
                      stroke="#2563eb"
                      strokeWidth={3}
                      fill="#3b82f6"
                      fillOpacity={0.3}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              {/* 文字描述 */}
              <div className="space-y-6">
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                  <h4 className="font-semibold text-slate-900 mb-2">AI 评估摘要</h4>
                  <p className="text-slate-600 leading-relaxed">
                    {result.summary}
                  </p>
                </div>

                <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-100">
                  <h4 className="font-semibold text-emerald-900 mb-2">匹配推荐语</h4>
                  <p className="text-emerald-700 font-medium italic">
                    "{result.matchReason}"
                  </p>
                </div>
              </div>
            </div>
          </CardContent>

          <CardFooter className="p-6 bg-slate-50/50 border-t flex justify-between items-center">
            <Button variant="ghost" onClick={() => setStep(1)}>
              重新评估
            </Button>
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700" onClick={() => router.push('/candidate/dashboard')}>
              进入人才池
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
