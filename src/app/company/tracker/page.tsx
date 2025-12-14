"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { MatchStatus } from "@/lib/types";
import {
  AlertCircle, BrainCircuit,
  CheckCircle2,
  DollarSign,
  Info,
  Pause,
  Play,
  ThumbsDown,
  ThumbsUp,
  TrendingUp,
  X
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Candidate, useCompany } from "../context";

export default function ProcessTrackerPage() {
  const {
    companyData,
    interviews, offers,
    moveToOffer, updateOffer
  } = useCompany();
  const [pipeline, setPipeline] = useState<Array<{
    id: string;
    status: MatchStatus;
    candidate: Candidate;
    jobTitle?: string;
    jobLocation?: string;
    matchScore?: number;
  }>>([]);
  const [loadingPipeline, setLoadingPipeline] = useState(true);
  const [pendingRejects, setPendingRejects] = useState<Record<string, ReturnType<typeof setTimeout>>>({});

  // Video playback status mock
  const [isPlaying, setIsPlaying] = useState(false);

  // Bidding input status
  const [offerInput, setOfferInput] = useState<string>("");

  const normalizeSkills = (skills: any[] = []) =>
    skills.map((s, index) => ({
      subject: s.subject || s.name || s.category || `Skill ${index + 1}`,
      A: Math.max(0, Math.min(100, s.A ?? s.level ?? 70)),
    }));

  const loadPipeline = async () => {
    try {
      setLoadingPipeline(true);
      const companyId = companyData?._id;
      if (!companyId) {
        setPipeline([]);
        toast.error("Please log in to your company account first");
        setLoadingPipeline(false);
        return;
      }

      const res = await fetch(`/api/company/pipeline?companyId=${companyId}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to load pipeline");
      }

      const formatted = (data.data || []).map((item: any) => {
        const candidateData = item.candidate || item.candidateSnapshot || {};
        const candidate: Candidate = {
          id: candidateData._id || candidateData.id || (crypto.randomUUID?.() ?? Date.now().toString()),
          name: candidateData.name || "Candidate",
          role: candidateData.role || "Open Role",
          avatar: candidateData.avatar || "https://github.com/shadcn.png",
          skills: normalizeSkills(candidateData.skills || []),
          summary: candidateData.summary || "",
        };

        return {
          id: item._id || crypto.randomUUID?.() || Date.now().toString(),
          status: item.status as MatchStatus,
          candidate,
          jobTitle: item.job?.title || item.jobSnapshot?.title || "Open Role",
          jobLocation: item.job?.location || item.jobSnapshot?.location || "Remote",
          matchScore: item.matchScore,
        };
      });

      setPipeline(formatted);
    } catch (error) {
      console.error("Pipeline fetch error:", error);
      toast.error("Failed to load candidate list");
    } finally {
      setLoadingPipeline(false);
    }
  };

  useEffect(() => {
    loadPipeline();
  }, [companyData?._id]);

  useEffect(() => {
    return () => {
      Object.values(pendingRejects).forEach((timer) => clearTimeout(timer));
    };
  }, [pendingRejects]);

  const updateStatus = async (matchId: string, status: MatchStatus, softDelete = false) => {
    const res = await fetch("/api/match/status", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matchId, status, softDelete }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || "Failed to update status");
    }
    return data;
  };

  const handleAccept = async (matchId: string) => {
    try {
      await updateStatus(matchId, "matched");
      await loadPipeline();
      toast.success("Candidate accepted, entering match status");
    } catch (error) {
      console.error("Accept error:", error);
      toast.error("Acceptance failed. Please try again later");
    }
  };

  const handleReject = (matchId: string) => {
    const timer = setTimeout(async () => {
      try {
        await updateStatus(matchId, "rejected", true);
        await loadPipeline();
      } catch (error) {
        console.error("Reject error:", error);
        toast.error("Rejection failed. Please try again later");
      } finally {
        setPendingRejects((prev) => {
          const copy = { ...prev };
          delete copy[matchId];
          return copy;
        });
      }
    }, 5000);

    setPendingRejects((prev) => ({ ...prev, [matchId]: timer }));
    setPipeline((prev) => prev.filter((item) => item.id !== matchId));

    toast.success("Candidate rejected.", {
      action: {
        label: "Undo",
        onClick: () => undoReject(matchId),
      },
    });
  };

  const undoReject = (matchId: string) => {
    const timer = pendingRejects[matchId];
    if (timer) {
      clearTimeout(timer);
    }
    setPendingRejects((prev) => {
      const copy = { ...prev };
      delete copy[matchId];
      return copy;
    });
    loadPipeline();
  };

  const handleSetInterview = async (matchId: string) => {
    try {
      await updateStatus(matchId, "interview_pending");
      await loadPipeline();
      toast.success("Interview created", { description: "Candidate has received AI interview invitation" });
    } catch (error) {
      console.error("Interview setup error:", error);
      toast.error("Failed to create interview");
    }
  };

  const handleRemove = async (matchId: string) => {
    try {
      await updateStatus(matchId, "rejected", true);
      await loadPipeline();
      toast.success("Match removed");
    } catch (error) {
      console.error("Remove error:", error);
      toast.error("Operation failed. Please try again later");
    }
  };

  const handleMakeOffer = (id: string) => {
    moveToOffer(id);
    toast.success("Candidate Moved to Offer Stage", {
      description: "Prepare your initial offer."
    });
  };

  const handleUpdateOffer = (id: string) => {
    const value = parseInt(offerInput.replace(/[^0-9]/g, ''));
    if (value) {
      updateOffer(id, value);
      toast.success("Offer Updated Successfully", {
        description: `New offer of $${value.toLocaleString()} sent to candidate.`
      });
      setOfferInput("");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Process Tracker</h1>
        <p className="text-slate-500 mt-2">Manage your hiring pipeline from interest to hire.</p>
      </div>

      <Tabs defaultValue="interested" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="interested">Interested ({pipeline.length})</TabsTrigger>
          <TabsTrigger value="interviews">Interview Review ({interviews.length})</TabsTrigger>
          <TabsTrigger value="offers">Offer Management ({offers.length})</TabsTrigger>
        </TabsList>

        {/* TAB 1: INTERESTED */}
        <TabsContent value="interested" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {loadingPipeline ? (
              <div className="col-span-full text-center py-12 text-slate-500 border-2 border-dashed rounded-xl">
                Loading pipeline...
              </div>
            ) : pipeline.length === 0 ? (
              <div className="col-span-full text-center py-12 text-slate-500 border-2 border-dashed rounded-xl">
                No candidates yet. Go to Talent Radar to find some!
              </div>
            ) : (
              pipeline.map((item) => {
                const statusLabel =
                  item.status === "matched"
                    ? { text: "Matched", className: "bg-emerald-100 text-emerald-700" }
                    : item.status === "candidate_interested"
                      ? { text: "Candidate Interested", className: "bg-blue-100 text-blue-700" }
                      : { text: "Sent by Company", className: "bg-slate-100 text-slate-600" };

                return (
                  <Card
                    key={item.id}
                    className="hover:shadow-md transition-shadow relative group/card h-full overflow-hidden"
                  >
                    <Button
                      size="icon"
                      variant="ghost"
                      className="absolute top-2 right-2 text-slate-400 hover:text-red-500 opacity-0 group-hover/card:opacity-100 transition-opacity"
                      onClick={() => handleRemove(item.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                    <CardHeader className="flex flex-row items-start gap-4 min-w-0">
                      <Avatar>
                        <AvatarImage src={item.candidate.avatar} />
                        <AvatarFallback>{item.candidate.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <CardTitle className="text-lg leading-tight break-words">{item.candidate.name}</CardTitle>
                            <CardDescription className="break-words">{item.candidate.role}</CardDescription>
                          </div>
                          <Badge className={statusLabel.className}>{statusLabel.text}</Badge>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 break-words">
                          {item.jobTitle} · {item.jobLocation}
                        </p>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3 min-w-0">
                      <div className="flex flex-wrap gap-2">
                        {item.candidate.skills.slice(0, 3).map((s) => (
                          <Badge
                            key={s.subject}
                            variant="secondary"
                            className="max-w-full whitespace-normal break-words leading-snug"
                          >
                            {s.subject}
                          </Badge>
                        ))}
                      </div>
                      {typeof item.matchScore === "number" && (
                        <p className="text-sm text-slate-500">Match Score: {(item.matchScore * 100).toFixed(0)}%</p>
                      )}
                      {item.status === "company_interested" && (
                        <div className="space-y-2">
                          <Button className="w-full bg-slate-200 text-slate-600" disabled>
                            Set AI Interview
                          </Button>
                          <p className="text-xs text-slate-500 text-center">Waiting for candidate response</p>
                        </div>
                      )}
                      {item.status === "candidate_interested" && (
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                            onClick={() => handleReject(item.id)}
                          >
                            Reject
                          </Button>
                          <Button
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                            onClick={() => handleAccept(item.id)}
                          >
                            Accept
                          </Button>
                        </div>
                      )}
                      {item.status === "matched" && (
                        <Button
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                          onClick={() => handleSetInterview(item.id)}
                        >
                          Set AI Interview
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        {/* TAB 2: INTERVIEW REVIEW */}
        <TabsContent value="interviews" className="space-y-6">
          {interviews.map(candidate => (
            <Card key={candidate.id} className="overflow-hidden">
              <div className="grid md:grid-cols-3 h-full">
                {/* Video Placeholder */}
                <div className="bg-slate-900 h-[300px] md:h-full flex items-center justify-center relative group cursor-pointer" onClick={() => setIsPlaying(!isPlaying)}>
                  <div className="absolute inset-0 opacity-50 bg-[url('https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=600&auto=format&fit=crop')] bg-cover bg-center" />
                  <div className="z-10 bg-white/20 backdrop-blur-sm p-4 rounded-full group-hover:scale-110 transition-transform">
                    {isPlaying ? <Pause className="w-8 h-8 text-white" /> : <Play className="w-8 h-8 text-white pl-1" />}
                  </div>
                  <div className="absolute bottom-4 left-4 text-white z-10">
                    <p className="font-bold">{candidate.name} - Technical Interview</p>
                    <p className="text-xs opacity-80">Duration: 45:00</p>
                  </div>
                </div>

                {/* AI Analysis */}
                <div className="md:col-span-2 p-6 flex flex-col h-full">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h2 className="text-2xl font-bold">{candidate.name}</h2>
                      <p className="text-slate-500">{candidate.role}</p>
                    </div>
                    {/* Score removed per request */}
                  </div>

                  <div className="space-y-4 mb-8">
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <BrainCircuit className="w-4 h-4 text-purple-600" />
                        AI Assessment Summary
                      </h4>
                      <p className="text-slate-600 leading-relaxed bg-purple-50 p-4 rounded-lg border border-purple-100">
                        {candidate.interviewFeedback}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Technical Depth</span>
                          <span className="font-bold">95%</span>
                        </div>
                        <Progress value={95} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Communication</span>
                          <span className="font-bold">88%</span>
                        </div>
                        <Progress value={88} className="h-2" />
                      </div>
                    </div>
                  </div>

                  <div className="mt-auto flex gap-4">
                    <Button variant="outline" className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700">
                      <ThumbsDown className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                    <Button onClick={() => handleMakeOffer(candidate.id)} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white">
                      <ThumbsUp className="w-4 h-4 mr-2" />
                      Approve & Make Offer
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
          {interviews.length === 0 && (
            <div className="text-center py-12 text-slate-500 border-2 border-dashed rounded-xl">
              No interviews in progress.
            </div>
          )}
        </TabsContent>

        {/* TAB 3: OFFER MANAGEMENT (Dynamic Bidding) */}
        <TabsContent value="offers" className="space-y-6">
          {offers.map(candidate => {
            const isWinning = (candidate.yourOffer || 0) > (candidate.marketOffer || 0);
            const gap = (candidate.yourOffer || 0) - (candidate.marketOffer || 0);

            return (
              <Card key={candidate.id} className="border-2 border-slate-100 overflow-hidden">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={candidate.avatar} />
                        <AvatarFallback>{candidate.name[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle>{candidate.name}</CardTitle>
                        <CardDescription>{candidate.role}</CardDescription>
                      </div>
                    </div>
                    <Badge variant={isWinning ? "default" : "destructive"} className={isWinning ? "bg-green-600" : ""}>
                      {isWinning ? "Leading Offer" : "Outbid by Competitor"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="grid md:grid-cols-2 gap-12 items-center">

                    {/* Market Data */}
                    <div className="space-y-6">
                      <div className="flex justify-between items-center p-4 bg-red-50 rounded-xl border border-red-100">
                        <div>
                          <p className="text-sm font-medium text-red-600 mb-1">Market Top Offer</p>
                          <p className="text-3xl font-bold text-red-700">${candidate.marketOffer?.toLocaleString()}</p>
                        </div>
                        <TrendingUp className="w-8 h-8 text-red-300" />
                      </div>

                      <div className={`flex justify-between items-center p-4 rounded-xl border ${isWinning ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-200'}`}>
                        <div>
                          <p className={`text-sm font-medium mb-1 ${isWinning ? 'text-emerald-600' : 'text-slate-500'}`}>Your Current Offer</p>
                          <p className={`text-3xl font-bold ${isWinning ? 'text-emerald-700' : 'text-slate-700'}`}>${candidate.yourOffer?.toLocaleString()}</p>
                        </div>
                        {isWinning ? <CheckCircle2 className="w-8 h-8 text-emerald-300" /> : <AlertCircle className="w-8 h-8 text-slate-300" />}
                      </div>

                      <div className="flex justify-between text-sm text-slate-500 px-2">
                        <span>Gap</span>
                        <span className={gap > 0 ? "text-green-600 font-bold" : "text-red-600 font-bold"}>
                          {gap > 0 ? "+" : ""}{gap.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Action Area */}
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold mb-2">Update Your Offer</h3>
                        <p className="text-sm text-slate-500 mb-4">
                          Increase your offer to stay competitive. The candidate will be notified instantly.
                        </p>
                        <div className="flex gap-4">
                          <div className="relative flex-1">
                            <DollarSign className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                            <Input
                              className="pl-10 h-11 text-lg"
                              placeholder="190,000"
                              value={offerInput}
                              onChange={(e) => setOfferInput(e.target.value)}
                            />
                          </div>
                          <Button size="lg" onClick={() => handleUpdateOffer(candidate.id)} className="bg-slate-900 text-white hover:bg-slate-800">
                            Update Offer
                          </Button>
                        </div>
                      </div>

                      <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-700 flex gap-2">
                        <Info className="w-5 h-5 flex-shrink-0" />
                        <p>
                          AI Prediction: An offer of <span className="font-bold">$188,000</span> has a 85% chance of being accepted based on candidate's preferences.
                        </p>
                      </div>
                    </div>

                  </div>
                </CardContent>
              </Card>
            );
          })}
          {offers.length === 0 && (
            <div className="text-center py-12 text-slate-500 border-2 border-dashed rounded-xl">
              No active offers.
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
