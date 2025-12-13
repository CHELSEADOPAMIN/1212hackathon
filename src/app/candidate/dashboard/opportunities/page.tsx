"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DollarSign, Heart, Info, MapPin, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const JOB_DATA = [
  {
    id: 1,
    company: "OpenAI",
    role: "AI Researcher",
    salary: "$200k - $350k",
    location: "San Francisco, CA",
    match: 98,
    tags: ["Python", "PyTorch", "LLM"],
    description: "Join the team building the future of AGI. You will work on training large language models and improving their reasoning capabilities.",
    reason: "Your experience with NLP and Transformer models makes you a perfect fit."
  },
  {
    id: 2,
    company: "Linear",
    role: "Senior Frontend Engineer",
    salary: "$180k - $240k",
    location: "Remote",
    match: 94,
    tags: ["React", "TypeScript", "WebGL"],
    description: "Build the next generation of issue tracking. We obsess over performance and user experience.",
    reason: "Your portfolio shows exceptional attention to UI detail and React performance optimization."
  },
  {
    id: 3,
    company: "Stripe",
    role: "Staff Backend Engineer",
    salary: "$220k - $300k",
    location: "New York, NY",
    match: 91,
    tags: ["Java", "Distributed Systems", "API Design"],
    description: "Help us increase the GDP of the internet. You will design and implement high-availability financial infrastructure.",
    reason: "Your background in microservices matches our infrastructure needs."
  }
];

export default function OpportunitiesPage() {
  const [jobs, setJobs] = useState(JOB_DATA);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<null | 'left' | 'right'>(null);

  const currentJob = jobs[currentIndex];

  const handleDecision = (dir: 'left' | 'right') => {
    setDirection(dir);

    setTimeout(() => {
      if (dir === 'right') {
        toast.success("Saved to Pending List", {
          description: "You can view this in the Applications tab.",
        });
      }
      setCurrentIndex((prev) => prev + 1);
      setDirection(null);
    }, 300);
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
        <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-violet-500 bg-clip-text text-transparent">
          Discover Jobs
        </h1>
        <p className="text-slate-500 mt-1">Find your next opportunity</p>
      </div>

      <div className="relative w-full h-[550px] z-10">
        {currentJob ? (
          <div className="w-full h-full p-2">
            <Card className={cardClass}>
              <div className="h-28 bg-gradient-to-br from-blue-500 to-indigo-600 p-6 flex items-end">
                <h2 className="text-2xl font-bold text-white leading-tight">{currentJob.company}</h2>
              </div>
              <CardContent className="p-5 flex flex-col gap-3 h-[calc(100%-112px)] justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold text-slate-800">{currentJob.role}</h3>
                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200 text-sm px-2 py-0.5">
                      {currentJob.match}% Match
                    </Badge>
                  </div>

                  <div className="flex flex-col gap-1 text-slate-600 mb-3 text-sm">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      <span className="font-semibold text-slate-900">{currentJob.salary}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>{currentJob.location}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-3">
                    {currentJob.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="bg-slate-100 text-slate-600 text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                    <p className="text-xs text-blue-800 italic leading-relaxed">
                      "AI: {currentJob.reason}"
                    </p>
                  </div>
                </div>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full mt-auto h-9 text-sm">
                      <Info className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{currentJob.role} at {currentJob.company}</DialogTitle>
                      <DialogDescription>{currentJob.location} • {currentJob.salary}</DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                      <h4 className="font-semibold">About the role</h4>
                      <p className="text-slate-600 leading-relaxed">{currentJob.description}</p>
                      <h4 className="font-semibold">Why you matched</h4>
                      <p className="text-slate-600 leading-relaxed">{currentJob.reason}</p>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="default">Apply Now</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-slate-500 animate-in fade-in">
            No more jobs to show!
          </div>
        )}
      </div>

      <div className="flex gap-8 mt-4 z-10">
        <Button
          size="lg"
          onClick={() => handleDecision('left')}
          disabled={!currentJob || direction !== null}
          className="rounded-full w-16 h-16 bg-white border-2 border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600 shadow-lg"
        >
          <X className="w-8 h-8" />
        </Button>
        <Button
          size="lg"
          onClick={() => handleDecision('right')}
          disabled={!currentJob || direction !== null}
          className="rounded-full w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 shadow-lg border-0"
        >
          <Heart className="w-8 h-8 fill-current" />
        </Button>
      </div>
    </div>
  );
}
