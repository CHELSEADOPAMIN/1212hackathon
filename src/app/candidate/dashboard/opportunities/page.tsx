"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DEFAULT_COMPANY_ID } from "@/lib/constants";
import type { MatchStatus } from "@/lib/types";
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
  matchStatus?: MatchStatus;
  matchId?: string;
  companyId?: string;
  isSpotlight?: boolean;
}

const toStringId = (value: any) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (value?.toString) return value.toString();
  return "";
};

export default function OpportunitiesPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<null | 'left' | 'right'>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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

        const response = await fetch('/api/candidate/opportunities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profile, candidateId: profile._id }),
        });

        if (!response.ok) throw new Error('Failed to fetch jobs');

        const data = await response.json();

        if (data.matches && data.matches.length > 0) {
          const formattedJobs = data.matches.map((job: any) => {
            const score = typeof job.score === 'number'
              ? job.score
              : (typeof job.matchScore === 'number' ? job.matchScore : undefined);
            const normalizedScore = score !== undefined ? Math.max(0, Math.min(1, score)) : 0.65;
            const matchStatus: MatchStatus | undefined = job.matchStatus;
            const isSpotlight = matchStatus === 'company_interested' || matchStatus === 'matched';

            return {
              id: toStringId(job._id || job.id),
              company: job.company || 'Unknown Company',
              companyId: toStringId(job.companyId || job.company || DEFAULT_COMPANY_ID),
              role: job.title || 'Open Role',
              salary: job.salary || 'TBD',
              location: job.location || 'Remote',
              match: Math.round(normalizedScore * 100),
              tags: job.requirements ? job.requirements.slice(0, 3) : [],
              description: job.description || 'No description available yet.',
              reason: isSpotlight
                ? 'They are already interested in you. Swipe right for instant matching.'
                : 'Smart recommendations based on skill and preference similarity.',
              matchStatus,
              matchId: job.matchId || job._id || job.id,
              isSpotlight,
            } as Job;
          });

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

  const handleDecision = async (dir: 'left' | 'right') => {
    setDirection(dir);
    const nextCardDelay = 300;
    const savedProfile = localStorage.getItem('userProfile');
    const profile = savedProfile ? JSON.parse(savedProfile) : null;

    const candidateId = toStringId(profile?._id || profile?.id);
    const companyId = toStringId(currentJob?.companyId || currentJob?.company || DEFAULT_COMPANY_ID);
    const jobId = toStringId(currentJob?.id);

    if (currentJob && candidateId && companyId && jobId) {
      try {
        const payload = {
          actor: 'candidate',
          action: dir === 'right' ? 'like' : 'reject',
          companyId,
          candidateId,
          jobId,
          matchScore: currentJob.match ? currentJob.match / 100 : undefined,
          jobSnapshot: {
            title: currentJob.role,
            company: currentJob.company,
            salary: currentJob.salary,
            location: currentJob.location,
            description: currentJob.description,
            requirements: currentJob.tags,
          },
        };

        const res = await fetch('/api/match/swipe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.error || `Failed to update match state (${res.status})`);
        }

        const status: MatchStatus | undefined = data.data?.status;
        const toastMessage = dir === 'right'
          ? (status === 'matched' ? 'Bidirectional match successful' : 'Your interest has been sent')
          : 'You have skipped this position';

        const toastDescription = dir === 'right'
          ? (status === 'matched'
            ? 'Matched with company. Go check interview arrangements.'
            : 'Waiting for company response. We will update status synchronously.')
          : 'This position will be removed from recommendations.';

        toast.success(toastMessage, { description: toastDescription });
      } catch (error) {
        console.error('Swipe update failed:', error);
        toast.error('Unable to update match status. Please try again later.', {
          description: (error as Error).message,
        });
      }
    } else if (!candidateId) {
      toast.error("Personal profile not found. Please log in again and try.");
    } else if (!companyId) {
      toast.error("Job data missing company information. Unable to operate temporarily.");
    } else if (!jobId) {
      toast.error("Job missing ID. Unable to complete operation.");
    }

    setTimeout(() => {
      setCurrentIndex((prev) => prev + 1);
      setDirection(null);
    }, nextCardDelay);
  };

  // Animation class calculation
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
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-emerald-500 bg-clip-text text-transparent">
          Discover Jobs
        </h1>
        <p className="text-slate-500 mt-1">Find your next opportunity</p>
      </div>

      <div className="relative w-full h-[550px] z-10">
        {currentJob ? (
          <div className="w-full h-full p-2">
            <Card className={cardClass}>
              <div className="relative h-28 bg-gradient-to-br from-blue-500 to-emerald-500 p-6 flex items-end">
                <h2 className="text-2xl font-bold text-white leading-tight">{currentJob.company}</h2>
                {currentJob.isSpotlight && (
                  <Badge className="absolute top-4 right-4 bg-white/90 text-emerald-700 border-emerald-200">
                    {currentJob.matchStatus === 'matched' ? 'Matched' : 'Interested in you'}
                  </Badge>
                )}
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

                  <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                    <p className="text-xs text-emerald-800 italic leading-relaxed">
                      "AI: {currentJob.reason}"
                    </p>
                  </div>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full mt-auto h-9 text-sm"
                      onClick={() => setIsDialogOpen(true)}
                    >
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
                      <Button
                        variant="default"
                        disabled={!currentJob || direction !== null}
                        onClick={() => {
                          setIsDialogOpen(false);
                          handleDecision('right');
                        }}
                      >
                        Apply Now
                      </Button>
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
          className="rounded-full w-16 h-16 bg-gradient-to-r from-blue-500 to-emerald-600 text-white hover:from-blue-600 hover:to-emerald-700 shadow-lg border-0"
        >
          <Heart className="w-8 h-8 fill-current" />
        </Button>
      </div>
    </div>
  );
}
