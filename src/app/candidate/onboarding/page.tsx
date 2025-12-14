"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, CheckCircle2, FileText, Github, Loader2, Mail, UploadCloud, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { DragEvent, useEffect, useRef, useState } from "react";
import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer } from 'recharts';
import { toast } from "sonner";

// 定义 API 返回的数据类型
interface AnalysisResult {
  name: string;
  role: string;
  summary: string;
  skills: { subject: string; A: number }[];
  experiences: { role: string; company: string; period: string; description: string }[];
  matchReason: string;
}

export default function OnboardingPage() {
  const router = useRouter();
  // Step 0: Email, Step 1: GitHub, Step 2: Resume, Step 3: Loading, Step 4: Result
  const [step, setStep] = useState(0);

  // Auth State
  const [email, setEmail] = useState("");
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);

  // Analysis State
  const [githubUrl, setGithubUrl] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [fileName, setFileName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("Initializing analysis...");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Loading 状态下的文字轮播效果
  useEffect(() => {
    if (isLoading) {
      const texts = [
        "Connecting to GitHub Neural Network...",
        "Verifying Code Originality...",
        "Parsing Project Complexity...",
        "AI Generating Skill Radar...",
        "Calculating Market Match..."
      ];
      let i = 0;
      const interval = setInterval(() => {
        i = (i + 1) % texts.length;
        setLoadingText(texts[i]);
      }, 800);
      return () => clearInterval(interval);
    }
  }, [isLoading]);

  // --- Step 0: Email Check ---
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsCheckingEmail(true);
    try {
      const res = await fetch("/api/auth/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, type: "candidate" }),
      });
      const data = await res.json();

      if (data.exists) {
        // User exists, log them in
        localStorage.setItem('userProfile', JSON.stringify(data.user));
        toast.success("Welcome back!", {
          description: "Logging you in..."
        });
        router.push('/candidate/dashboard');
      } else {
        // New user, proceed to onboarding
        toast.info("Welcome!", {
          description: "Let's build your AI profile."
        });
        setStep(1);
      }
    } catch (error) {
      console.error(error);
      toast.error("Error checking email");
    } finally {
      setIsCheckingEmail(false);
    }
  };

  const handleGithubSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (githubUrl.trim()) {
      setStep(2);
    }
  };

  const processFile = async (file: File) => {
    setFileName(file.name);

    if (file.type === "text/plain" || file.name.endsWith(".md") || file.name.endsWith(".txt")) {
      const text = await file.text();
      setResumeText(text);
    } else {
      setResumeText(`[File Uploaded: ${file.name}]. Content extraction mocked for demo.`);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await processFile(file);
  };

  // Drag & Drop Handlers
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) await processFile(file);
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
        // Save to LocalStorage for Dashboard (temporary until confirmed)
        localStorage.setItem('userProfile', JSON.stringify({ ...data.data, email }));
        setStep(4);
      } else {
        alert("Analysis failed, please try again.");
        setStep(1);
      }
    } catch (error) {
      console.error(error);
      alert("Network error");
      setStep(1);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnterTalentPool = async () => {
    if (!result) return;
    setIsSaving(true);
    try {
      const res = await fetch("/api/candidate/profile/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...result, githubUrl, email }),
      });

      if (res.ok) {
        const savedData = await res.json();
        // Update local storage with the full profile including _id from DB
        if (savedData.success && savedData.data) {
          localStorage.setItem('userProfile', JSON.stringify(savedData.data));
        }
        router.push('/candidate/dashboard');
      } else {
        const errorData = await res.json();
        alert(`Failed to save profile: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Save error:", error);
      alert("Error saving profile. Please check your connection.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 p-4">

      {/* Step 0: Email Input */}
      {step === 0 && (
        <Card className="w-full max-w-md animate-in fade-in zoom-in duration-300">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Mail className="w-6 h-6" />
              Welcome to Lyrathon
            </CardTitle>
            <CardDescription>
              Enter your email to start the AI assessment or sign in.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={!email.trim() || isCheckingEmail}>
                {isCheckingEmail ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Checking...
                  </>
                ) : (
                  "Continue"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Step 1: GitHub Input */}
      {step === 1 && (
        <Card className="w-full max-w-md animate-in slide-in-from-right-8 duration-300">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Github className="w-6 h-6" />
              Step 1: Code Power
            </CardTitle>
            <CardDescription>
              We need your GitHub URL to assess your technical depth.
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
                Next
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Resume Upload */}
      {step === 2 && (
        <Card className="w-full max-w-md animate-in slide-in-from-right-8 duration-300">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <FileText className="w-6 h-6" />
              Step 2: Upload Resume
            </CardTitle>
            <CardDescription>
              Supports PDF, Word, TXT, or Markdown. AI will extract key experiences.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Upload Area */}
            {!fileName ? (
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${isDragging ? "border-blue-500 bg-blue-50" : "border-slate-300 hover:bg-slate-50"
                  }`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
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
                  <p className="font-medium">Click or Drag file here</p>
                  <p className="text-xs">Max size 10MB</p>
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
                    <p className="text-blue-600 text-xs">Ready</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={clearFile} className="hover:bg-blue-100 text-slate-400 hover:text-red-500">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}

            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink-0 mx-4 text-xs text-slate-400">OR PASTE TEXT</span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            <Textarea
              placeholder="Paste your bio or resume content here..."
              className="min-h-[100px] text-sm"
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
            />

            <Button
              onClick={handleAnalysisSubmit}
              className="w-full"
              disabled={!resumeText.trim()}
            >
              Start AI Analysis
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Loading */}
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
            <p className="text-sm text-slate-500">This may take a few seconds</p>
          </div>
        </div>
      )}

      {/* Step 4: Result */}
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
              {/* Radar Chart */}
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

              {/* Text Description */}
              <div className="space-y-6">
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                  <h4 className="font-semibold text-slate-900 mb-2">AI Summary</h4>
                  <p className="text-slate-600 leading-relaxed">
                    {result.summary}
                  </p>
                </div>

                <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-100">
                  <h4 className="font-semibold text-emerald-900 mb-2">Match Reason</h4>
                  <p className="text-emerald-700 font-medium italic">
                    "{result.matchReason}"
                  </p>
                </div>
              </div>
            </div>
          </CardContent>

          <CardFooter className="p-6 bg-slate-50/50 border-t flex justify-between items-center">
            <Button variant="ghost" onClick={() => setStep(1)} disabled={isSaving}>
              Retry
            </Button>
            <Button
              size="lg"
              className="bg-blue-600 hover:bg-blue-700"
              onClick={handleEnterTalentPool}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  Enter Talent Pool
                  <ArrowRight className="ml-2 w-4 h-4" />
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
