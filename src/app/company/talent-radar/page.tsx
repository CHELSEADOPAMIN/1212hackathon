"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BrainCircuit, Heart, Users, X } from "lucide-react";
import { useState } from "react";
import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer } from 'recharts';
import { toast } from "sonner";
import { Candidate, useCompany } from "../context";

// Mock Candidates
const MOCK_CANDIDATES: Candidate[] = [
  {
    id: "c1",
    name: "David Kim",
    role: "Full Stack Architect",
    avatar: "https://github.com/shadcn.png",
    skills: [
      { subject: 'React', A: 98 },
      { subject: 'Node', A: 95 },
      { subject: 'AWS', A: 85 },
      { subject: 'Design', A: 80 },
      { subject: 'Lead', A: 90 },
    ],
    summary: "Ex-Google engineer with 8 years of experience building scalable systems.",
  },
  {
    id: "c2",
    name: "Emily Wang",
    role: "AI Research Scientist",
    avatar: "https://github.com/shadcn.png",
    skills: [
      { subject: 'Python', A: 99 },
      { subject: 'PyTorch', A: 95 },
      { subject: 'Math', A: 98 },
      { subject: 'NLP', A: 92 },
      { subject: 'Lead', A: 70 },
    ],
    summary: "PhD in Computer Science. Published 3 papers on LLM optimization.",
  }
];

export default function TalentRadarPage() {
  const { addToInterested } = useCompany();
  const [candidates, setCandidates] = useState(MOCK_CANDIDATES);
  const [currentIndex, setCurrentIndex] = useState(0); // 从 0 开始，正序显示
  const [direction, setDirection] = useState<null | 'left' | 'right'>(null);

  const currentCandidate = candidates[currentIndex];

  const handleDecision = (dir: 'left' | 'right') => {
    setDirection(dir);

    // 动画延迟后切换数据
    setTimeout(() => {
      if (dir === 'right' && currentCandidate) {
        addToInterested(currentCandidate);
        toast.success("Candidate Saved", {
          description: `${currentCandidate.name} added to Process Tracker.`,
        });
      }
      setCurrentIndex((prev) => prev + 1);
      setDirection(null);
    }, 300); // 300ms 动画时间
  };

  const reset = () => {
    setCurrentIndex(0);
    setDirection(null);
  };

  // 动画 Class 计算
  let cardClass = "h-full shadow-xl border-2 border-slate-100 bg-white overflow-hidden transition-all duration-300 ease-in-out transform";
  if (direction === 'left') {
    cardClass += " -translate-x-full opacity-0 rotate-[-10deg]";
  } else if (direction === 'right') {
    cardClass += " translate-x-full opacity-0 rotate-[10deg]";
  } else {
    cardClass += " translate-x-0 opacity-100 rotate-0";
  }

  return (
    <div className="flex flex-col items-center h-[calc(100vh-80px)] w-full max-w-md mx-auto relative pt-2">
      <div className="text-center w-full mb-4 z-0">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
          Talent Radar
        </h1>
        <p className="text-slate-500 mt-1">Find your next star employee</p>
      </div>

      <div className="relative w-full h-[550px] z-10">
        {currentCandidate ? (
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

              <CardContent className="px-6 -mt-8 flex flex-col gap-3 h-[calc(100%-120px)]">
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
                  <p className="text-slate-600 text-xs leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100 line-clamp-3">
                    {currentCandidate.summary}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 mt-auto">
                  <Badge variant="secondary" className="text-xs">React Expert</Badge>
                  <Badge variant="secondary" className="text-xs">Top 1% Github</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-4 animate-in fade-in">
            <Users className="w-12 h-12 opacity-20" />
            <p>No more candidates.</p>
            <Button variant="outline" onClick={reset}>Reset List</Button>
          </div>
        )}
      </div>

      <div className="flex gap-8 mt-4 z-10">
        <Button
          size="lg"
          onClick={() => handleDecision('left')}
          disabled={!currentCandidate || direction !== null}
          className="rounded-full w-16 h-16 bg-white border-2 border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600 shadow-lg"
        >
          <X className="w-8 h-8" />
        </Button>
        <Button
          size="lg"
          onClick={() => handleDecision('right')}
          disabled={!currentCandidate || direction !== null}
          className="rounded-full w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 shadow-lg border-0"
        >
          <Heart className="w-8 h-8 fill-current" />
        </Button>
      </div>
    </div>
  );
}
