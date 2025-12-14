"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DEFAULT_COMPANY_ID } from "@/lib/constants";
import { BrainCircuit, Heart, Loader2, Users, X } from "lucide-react";
import { useEffect, useState } from "react";
import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer } from 'recharts';
import { toast } from "sonner";
import type { Candidate } from "../context";
import { useCompany } from "../context";

interface JobOption {
  id: string;
  title: string;
}

export default function TalentRadarPage() {
  const { companyData } = useCompany();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<null | 'left' | 'right'>(null);

  // Job Selection State
  const [jobs, setJobs] = useState<JobOption[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [loadingJobs, setLoadingJobs] = useState(true);

  // 1. Load Jobs
  useEffect(() => {
    const companyId = companyData?._id;
    if (!companyId) {
      setJobs([]);
      setLoadingJobs(false);
      return;
    }

    setLoadingJobs(true);
    const fetchJobs = async () => {
      try {
        const res = await fetch(`/api/company/jobs?companyId=${companyId}`);
        const data = await res.json();

        if (data.success && data.data.length > 0) {
          const jobOptions = data.data.map((j: any) => ({ id: j._id, title: j.title }));
          setJobs(jobOptions);
          // Default select the first job
          setSelectedJobId(jobOptions[0].id);
        } else {
          setJobs([]);
        }
      } catch (error) {
        console.error("Failed to load jobs", error);
      } finally {
        setLoadingJobs(false);
      }
    };
    fetchJobs();
  }, [companyData?._id]);

  // 2. Fetch Candidates when Job changes
  useEffect(() => {
    if (!selectedJobId) {
      setCandidates([]);
      return;
    }

    const fetchCandidates = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/recommendations/candidates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            // We pass just the ID, the backend should fetch the job details
            jobId: selectedJobId,
            companyId: companyData?._id || DEFAULT_COMPANY_ID
          }),
        });

        if (!response.ok) throw new Error('Failed to fetch candidates');

        const data = await response.json();

        if (data.matches && data.matches.length > 0) {
          const formattedCandidates = data.matches.map((c: any) => ({
            id: c._id,
            name: c.name,
            role: c.role,
            avatar: c.avatar || "https://github.com/shadcn.png",
            skills: c.skills.map((s: any) => ({
              subject: typeof s === 'string' ? s : s.name,
              A: typeof s === 'object' && s.level ? s.level : 0
            })).slice(0, 5),
            summary: c.summary,
          }));
          setCandidates(formattedCandidates);
          setCurrentIndex(0);
        } else {
          setCandidates([]);
        }

      } catch (error) {
        console.error("Error fetching candidates:", error);
        toast.error("Failed to load candidate recommendations");
      } finally {
        setLoading(false);
      }
    };

    fetchCandidates();
  }, [selectedJobId]);


  const currentCandidate = candidates[currentIndex];

  const handleDecision = (dir: 'left' | 'right') => {
    const companyId = companyData?._id || DEFAULT_COMPANY_ID;
    if (!selectedJobId) return;
    if (!companyId) {
      toast.error("Please log in to your company account before proceeding");
      return;
    }

    setDirection(dir);

    setTimeout(async () => {
      if (dir === 'right' && currentCandidate) {
        try {
          const payload = {
            actor: "company",
            action: "like",
            companyId,
            candidateId: currentCandidate.id,
            jobId: selectedJobId,
            matchScore: 0.85, // ideally calculated by backend
          };

          const res = await fetch("/api/match/swipe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          const data = await res.json();

          if (!res.ok || !data.success) {
            throw new Error(data.error || "Failed to save interest");
          }

          toast.success("Candidate Saved", {
            description: `${currentCandidate.name} has been added to Process Tracker.`,
          });
        } catch (error) {
          console.error("Save match error:", error);
          toast.error("Save failed, please try again later");
        }
      }
      setCurrentIndex((prev) => prev + 1);
      setDirection(null);
    }, 300);
  };

  const reset = () => {
    setCurrentIndex(0);
    setDirection(null);
  };

  // 动画 Class 计算
  let cardClass = "h-full min-w-0 shadow-xl border-2 border-slate-100 bg-white overflow-hidden transition-all duration-300 ease-in-out transform";
  if (direction === 'left') {
    cardClass += " -translate-x-full opacity-0 rotate-[-10deg]";
  } else if (direction === 'right') {
    cardClass += " translate-x-full opacity-0 rotate-[10deg]";
  } else {
    cardClass += " translate-x-0 opacity-100 rotate-0";
  }

  if (loadingJobs) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-80px)] w-full">
        <Loader2 className="w-10 h-10 animate-spin text-slate-400" />
        <p className="mt-4 text-slate-500">Loading your jobs...</p>
      </div>
    );
  }

  // No jobs state
  if (jobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-80px)] w-full">
        <div className="bg-slate-100 p-6 rounded-full mb-4">
          <BrainCircuit className="w-12 h-12 text-slate-400" />
        </div>
        <h2 className="text-xl font-semibold text-slate-900">No Jobs Found</h2>
        <p className="mt-2 text-slate-500 max-w-sm text-center">
          You need to post a job before you can find candidates.
        </p>
        <Button className="mt-6" onClick={() => window.location.href = '/company/jobs'}>
          Post a Job
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center h-[calc(100vh-80px)] w-full max-w-md mx-auto relative pt-2">
      <div className="text-center w-full mb-4 z-50 flex flex-col items-center">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
          Talent Radar
        </h1>

        {/* Job Selector */}
        <div className="mt-2 w-full max-w-xs">
          <Select value={selectedJobId} onValueChange={setSelectedJobId}>
            <SelectTrigger className="w-full bg-white/50 backdrop-blur border-slate-200">
              <SelectValue placeholder="Select a job to match">
                {jobs.find(j => j.id === selectedJobId)?.title || "Select a job to match"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {jobs.map(job => (
                <SelectItem key={job.id} value={job.id}>{job.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="relative w-full h-[550px] z-10">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full w-full bg-white/50 rounded-xl border border-dashed border-slate-200">
            <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
            <p className="mt-4 text-slate-500">AI is finding the best matches...</p>
          </div>
        ) : currentCandidate ? (
          <div className="w-full h-full p-2">
            <Card className={cardClass}>
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 text-white pb-12">
                <div className="flex items-center gap-4">
                  <Avatar className="w-14 h-14 border-2 border-emerald-400">
                    <AvatarImage src={currentCandidate.avatar} />
                    <AvatarFallback>{currentCandidate.name[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="text-xl font-bold">{currentCandidate.name}</h2>
                    <p className="text-emerald-400 font-medium text-sm">{currentCandidate.role}</p>
                  </div>
                </div>
              </div>

              <CardContent className="px-6 -mt-8 flex flex-col gap-3 h-[calc(100%-120px)] min-h-0 overflow-hidden">
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-2 h-[220px] shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={currentCandidate.skills}>
                      <PolarGrid stroke="#e2e8f0" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                      <Radar
                        name="Skill"
                        dataKey="A"
                        stroke="#10b981"
                        strokeWidth={3}
                        fill="#10b981"
                        fillOpacity={0.3}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-slate-700 font-semibold text-sm">
                    <BrainCircuit className="w-4 h-4 text-emerald-600" />
                    AI Insight
                  </div>
                  <div className="text-slate-600 text-xs leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100 max-h-28 overflow-y-auto pr-2 whitespace-pre-line">
                    {currentCandidate.summary}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-auto max-h-20 overflow-y-auto pr-1">
                  {currentCandidate.skills.slice(0, 3).map((skill, i) => (
                    <Badge
                      key={i}
                      variant="secondary"
                      className="text-xs max-w-full whitespace-normal break-words leading-snug"
                    >
                      {skill.subject}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-4 animate-in fade-in">
            <Users className="w-12 h-12 opacity-20" />
            <p>No more candidates found for this role.</p>
            <Button variant="outline" onClick={reset}>Reset List</Button>
          </div>
        )}
      </div>

      <div className="flex gap-8 mt-4 z-10">
        <Button
          size="lg"
          onClick={() => handleDecision('left')}
          disabled={!currentCandidate || direction !== null || loading}
          className="rounded-full w-16 h-16 bg-white border-2 border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600 shadow-lg"
        >
          <X className="w-8 h-8" />
        </Button>
        <Button
          size="lg"
          onClick={() => handleDecision('right')}
          disabled={!currentCandidate || direction !== null || loading}
          className="rounded-full w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 shadow-lg border-0"
        >
          <Heart className="w-8 h-8 fill-current" />
        </Button>
      </div>
    </div>
  );
}
