"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DollarSign, Heart, Info, Loader2, MapPin, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Job {
  id: string;
  company: string;
  role: string;
  salary: string;
  location: string;
  match: number;
  tags: string[];
  description: string;
  reason: string;
}

export default function OpportunitiesPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<null | 'left' | 'right'>(null);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const savedProfile = localStorage.getItem('userProfile');
        if (!savedProfile) {
          setLoading(false);
          // Fallback or redirect could go here
          return;
        }

        const profile = JSON.parse(savedProfile);

        let response = await fetch('/api/recommendations/jobs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profile }),
        });

        // Fallback to legacy endpoint if needed
        if (!response.ok) {
          response = await fetch('/api/matches/jobs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ profile }),
          });
        }

        if (!response.ok) throw new Error('Failed to fetch jobs');

        const data = await response.json();

        if (data.matches && data.matches.length > 0) {
          // Transform API data to UI format
          const formattedJobs = data.matches.map((job: any) => ({
            id: job._id,
            company: job.company,
            role: job.title,
            salary: job.salary,
            location: job.location,
            match: Math.round(job.score * 100),
            tags: job.requirements ? job.requirements.slice(0, 3) : [],
            description: job.description,
            reason: "High similarity based on your skill set and role preference." // Placeholder for AI reason
          }));
          setJobs(formattedJobs);
        } else {
          setJobs([]);
        }

      } catch (error) {
        console.error("Error fetching jobs:", error);
        toast.error("Failed to load job recommendations");
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-80px)] w-full">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
        <p className="mt-4 text-slate-500">Finding your perfect matches...</p>
      </div>
    );
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
            {jobs.length === 0 ? "No matches found yet. Try updating your profile!" : "No more jobs to show!"}
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
