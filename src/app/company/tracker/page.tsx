"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import type { MatchStatus } from "@/lib/types";
import {
  AlertCircle, BrainCircuit,
  CheckCircle2,
  DollarSign,
  Info,
  Loader2,
  Plus,
  ThumbsDown,
  ThumbsUp,
  TrendingUp,
  Trash2,
  X
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Candidate, useCompany } from "../context";

type RawSkill = { subject?: string; name?: string; category?: string; level?: number; A?: number };

interface PipelineMatchResponse {
  _id?: string;
  status: MatchStatus;
  matchScore?: number;
  candidate?: {
    _id?: string;
    id?: string;
    name?: string;
    role?: string;
    avatar?: string;
    skills?: RawSkill[];
    summary?: string;
  };
  candidateSnapshot?: PipelineMatchResponse["candidate"];
  job?: { title?: string; location?: string };
  jobSnapshot?: { title?: string; location?: string };
  offer?: { amount?: number; currency?: string; message?: string; createdAt?: string };
  marketOffer?: number;
  offerCount?: number;
  averageCompetitorOffer?: number;
  interview?: {
    _id?: string;
    matchId?: string;
    recordingUrl?: string;
    createdAt?: string;
    updatedAt?: string;
  };
}

type PipelineCard = {
  id: string;
  status: MatchStatus;
  candidate: Candidate;
  jobTitle?: string;
  jobLocation?: string;
  matchScore?: number;
};

type InterviewReview = Candidate & {
  matchId: string;
  jobTitle?: string;
  jobLocation?: string;
  recordingUrl?: string;
  status: MatchStatus;
};

type OfferEntry = Candidate & {
  matchId: string;
  status: MatchStatus;
  currency?: string;
  offerMessage?: string;
  offerCount?: number;
  averageCompetitorOffer?: number;
  jobTitle?: string;
  jobLocation?: string;
};

const DEFAULT_INTERVIEW_QUESTIONS = [
  "Please describe a recent project you led and its most noteworthy technical achievement.",
  "What was the toughest technical problem you faced, and how did you break it down?",
  "What kind of team culture do you thrive in?",
];

export default function ProcessTrackerPage() {
  const { companyData } = useCompany();
  const [pipeline, setPipeline] = useState<PipelineCard[]>([]);
  const [interviewReviews, setInterviewReviews] = useState<InterviewReview[]>([]);
  const [offerEntries, setOfferEntries] = useState<OfferEntry[]>([]);
  const [loadingPipeline, setLoadingPipeline] = useState(true);
  const [pendingRejects, setPendingRejects] = useState<Record<string, ReturnType<typeof setTimeout>>>({});

  // Bidding input status
  const [offerDrafts, setOfferDrafts] = useState<Record<string, string>>({});
  const [offerDialogOpen, setOfferDialogOpen] = useState(false);
  const [activeOfferMatchId, setActiveOfferMatchId] = useState<string | null>(null);
  const [offerForm, setOfferForm] = useState({ amount: "", message: "" });
  const [isSubmittingOffer, setIsSubmittingOffer] = useState(false);

  // Interview setup dialog state
  const [interviewDialogOpen, setInterviewDialogOpen] = useState(false);
  const [activeMatchId, setActiveMatchId] = useState<string | null>(null);
  const [questionList, setQuestionList] = useState<string[]>(() => [...DEFAULT_INTERVIEW_QUESTIONS]);
  const [isScheduling, setIsScheduling] = useState(false);

  const normalizeSkills = useCallback(
    (skills: RawSkill[] = []): Candidate["skills"] =>
      skills.map((s, index) => ({
        subject: s.subject || s.name || s.category || `Skill ${index + 1}`,
        A: Math.max(0, Math.min(100, s.A ?? s.level ?? 70)),
      })),
    []
  );

  const loadPipeline = useCallback(async () => {
      try {
        setLoadingPipeline(true);
        const companyId = companyData?._id;
        if (!companyId) {
          setPipeline([]);
          setInterviewReviews([]);
          setOfferEntries([]);
          toast.error("Please log in to your company account first");
          setLoadingPipeline(false);
          return;
        }

      const res = await fetch(`/api/company/pipeline?companyId=${companyId}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to load pipeline");
      }

      const apiMatches: PipelineMatchResponse[] = data.data || [];
      const nextPipeline: PipelineCard[] = [];
      const nextInterviews: InterviewReview[] = [];
      const nextOffers: OfferEntry[] = [];

      apiMatches.forEach((item) => {
        const candidateData = item.candidate || item.candidateSnapshot || {};
        const candidate: Candidate = {
          id: candidateData._id || candidateData.id || (crypto.randomUUID?.() ?? Date.now().toString()),
          name: candidateData.name || "Candidate",
          role: candidateData.role || "Open Role",
          avatar: candidateData.avatar || "https://github.com/shadcn.png",
          skills: normalizeSkills(candidateData.skills || []),
          summary: candidateData.summary || "",
        };

        const id = item._id || crypto.randomUUID?.() || Date.now().toString();
        const status = item.status as MatchStatus;
        const jobTitle = item.job?.title || item.jobSnapshot?.title || "Open Role";
        const jobLocation = item.job?.location || item.jobSnapshot?.location || "Remote";

        if (["company_interested", "candidate_interested", "matched", "interview_pending"].includes(status)) {
          nextPipeline.push({
            id,
            status,
            candidate,
            jobTitle,
            jobLocation,
            matchScore: item.matchScore,
          });
        }

        if (status === "interview_completed") {
          nextInterviews.push({
            ...candidate,
            matchId: id,
            jobTitle,
            jobLocation,
            recordingUrl: item.interview?.recordingUrl,
            status,
          });
        }

        if (["offer_pending", "offer_accepted", "offer_rejected"].includes(status)) {
          const yourOffer = typeof item.offer?.amount === "number" ? item.offer.amount : undefined;

          nextOffers.push({
            ...candidate,
            matchId: id,
            status,
            yourOffer,
            currency: item.offer?.currency,
            offerMessage: item.offer?.message,
            marketOffer: item.marketOffer ?? 0,
            offerCount: item.offerCount ?? 0,
            averageCompetitorOffer: item.averageCompetitorOffer ?? 0,
            jobTitle,
            jobLocation,
          });
        }
      });

      setPipeline(nextPipeline);
      setInterviewReviews(nextInterviews);
      setOfferEntries(nextOffers);
    } catch (error) {
      console.error("Pipeline fetch error:", error);
      toast.error("Failed to load candidate list");
    } finally {
      setLoadingPipeline(false);
    }
  }, [companyData?._id, normalizeSkills]);

  useEffect(() => {
    loadPipeline();
  }, [loadPipeline]);

  useEffect(() => {
    return () => {
      Object.values(pendingRejects).forEach((timer) => clearTimeout(timer));
    };
  }, [pendingRejects]);

  const offerSummary = useMemo(() => {
    const count = offerEntries.length;
    const values = offerEntries
      .map((entry) => entry.yourOffer)
      .filter((value): value is number => typeof value === "number" && !Number.isNaN(value));
    const average =
      values.length > 0 ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0;

    const marketValues = offerEntries
      .map((entry) => entry.marketOffer ?? 0)
      .filter((value) => value > 0);
    const marketAverage =
      marketValues.length > 0
        ? Math.round(marketValues.reduce((sum, value) => sum + value, 0) / marketValues.length)
        : 0;

    return { count, average, marketAverage };
  }, [offerEntries]);

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

  const resetInterviewDialog = () => {
    setActiveMatchId(null);
    setQuestionList([...DEFAULT_INTERVIEW_QUESTIONS]);
    setIsScheduling(false);
  };

  const openInterviewDialog = (matchId: string) => {
    setActiveMatchId(matchId);
    setQuestionList([...DEFAULT_INTERVIEW_QUESTIONS]);
    setInterviewDialogOpen(true);
  };

  const handleQuestionChange = (index: number, value: string) => {
    setQuestionList((prev) => prev.map((q, i) => (i === index ? value : q)));
  };

  const handleAddQuestion = () => {
    setQuestionList((prev) => [...prev, ""]);
  };

  const handleRemoveQuestion = (index: number) => {
    setQuestionList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmitInterview = async () => {
    if (!activeMatchId) {
      toast.error("Missing match id");
      return;
    }

    const payloadQuestions = questionList.map((q) => q.trim()).filter(Boolean);
    if (payloadQuestions.length === 0) {
      toast.error("Please provide at least one interview question.");
      return;
    }

    try {
      setIsScheduling(true);
      const res = await fetch("/api/interview/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId: activeMatchId, questions: payloadQuestions }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to schedule interview");
      }
      toast.success("Interview scheduled", { description: "Candidate has received the AI interview link." });
      setInterviewDialogOpen(false);
      resetInterviewDialog();
      await loadPipeline();
    } catch (error) {
      console.error("Interview setup error:", error);
      const message = error instanceof Error ? error.message : "Failed to create interview";
      toast.error("Failed to create interview", { description: message });
    } finally {
      setIsScheduling(false);
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

  const resetOfferDialog = () => {
    setOfferDialogOpen(false);
    setActiveOfferMatchId(null);
    setOfferForm({ amount: "", message: "" });
    setIsSubmittingOffer(false);
  };

  const openOfferDialog = (matchId: string, presetAmount?: number, presetMessage?: string) => {
    setActiveOfferMatchId(matchId);
    setOfferForm({
      amount: presetAmount ? presetAmount.toString() : "",
      message: presetMessage || "",
    });
    setOfferDialogOpen(true);
  };

  const upsertOffer = async (matchId: string, amount: number, message?: string, currency?: string) => {
    const res = await fetch("/api/company/offer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matchId, amount, message, currency }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || "Failed to update offer");
    }
  };

  const handleMakeOffer = (matchId: string, presetAmount?: number, presetMessage?: string) => {
    openOfferDialog(matchId, presetAmount, presetMessage);
  };

  const submitOffer = async () => {
    if (!activeOfferMatchId) {
      toast.error("Missing match id");
      return;
    }

    const value = parseInt(offerForm.amount.replace(/[^0-9]/g, ""), 10);
    if (!value) {
      toast.error("Please enter a numeric offer.");
      return;
    }

    try {
      setIsSubmittingOffer(true);
      await upsertOffer(activeOfferMatchId, value, offerForm.message);
      toast.success("Offer sent", { description: "Candidate has received your updated offer." });
      resetOfferDialog();
      await loadPipeline();
    } catch (error) {
      console.error("Offer submit error:", error);
      toast.error("Failed to send offer", { description: (error as Error).message });
    } finally {
      setIsSubmittingOffer(false);
    }
  };

  const handleUpdateOffer = async (matchId: string) => {
    const draft = offerDrafts[matchId] ?? "";
    const value = parseInt(draft.replace(/[^0-9]/g, ""), 10);
    if (!value) {
      toast.error("Please enter a numeric offer.");
      return;
    }

    const existing = offerEntries.find((item) => item.matchId === matchId);

    try {
      await upsertOffer(matchId, value, existing?.offerMessage, existing?.currency);
      toast.success("Offer updated", {
        description: `New offer of ${value.toLocaleString()} sent to candidate.`,
      });
      setOfferDrafts((prev) => ({ ...prev, [matchId]: "" }));
      await loadPipeline();
    } catch (error) {
      console.error("Update offer error:", error);
      toast.error("Unable to update offer", { description: (error as Error).message });
    }
  };

  const handleRejectAfterInterview = async (matchId: string) => {
    try {
      await updateStatus(matchId, "rejected", true);
      await loadPipeline();
      toast.success("Candidate rejected");
    } catch (error) {
      console.error("Interview rejection error:", error);
      toast.error("Failed to reject candidate");
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
          <TabsTrigger value="interviews">Interview Review ({interviewReviews.length})</TabsTrigger>
          <TabsTrigger value="offers">Offer Management ({offerEntries.length})</TabsTrigger>
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
                      : item.status === "interview_pending"
                        ? { text: "Interview Scheduled", className: "bg-emerald-50 text-emerald-700" }
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
                          onClick={() => openInterviewDialog(item.id)}
                        >
                          Set AI Interview
                        </Button>
                      )}
                      {item.status === "interview_pending" && (
                        <div className="rounded-lg border border-emerald-100 bg-emerald-50 text-emerald-700 px-3 py-2 text-sm">
                          AI interview invite sent; waiting for the candidate to start.
                        </div>
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
          {interviewReviews.map(candidate => (
            <Card key={candidate.matchId} className="overflow-hidden">
              <div className="grid md:grid-cols-3 h-full">
                <div className="bg-slate-900 h-[300px] md:h-full relative">
                  {candidate.recordingUrl ? (
                    <video
                      controls
                      src={candidate.recordingUrl}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-slate-200 text-sm px-6 text-center">
                      Interview recording unavailable.
                    </div>
                  )}
                </div>

                <div className="md:col-span-2 p-6 flex flex-col h-full">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h2 className="text-2xl font-bold">{candidate.name}</h2>
                      <p className="text-slate-500">{candidate.role}</p>
                    </div>
                    <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-100">
                      Awaiting Review
                    </Badge>
                  </div>

                  <div className="space-y-4 mb-8">
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <BrainCircuit className="w-4 h-4 text-purple-600" />
                        AI Assessment Summary
                      </h4>
                      <p className="text-slate-600 leading-relaxed bg-purple-50 p-4 rounded-lg border border-purple-100">
                        {candidate.interviewFeedback || candidate.summary || "Awaiting automated feedback."}
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
                    <Button
                      variant="outline"
                      className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                      onClick={() => handleRejectAfterInterview(candidate.matchId)}
                    >
                      <ThumbsDown className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                    <Button
                      onClick={() => handleMakeOffer(candidate.matchId)}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <ThumbsUp className="w-4 h-4 mr-2" />
                      Approve & Make Offer
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
          {interviewReviews.length === 0 && (
            <div className="text-center py-12 text-slate-500 border-2 border-dashed rounded-xl">
              No interviews in progress.
            </div>
          )}
        </TabsContent>

        {/* TAB 3: OFFER MANAGEMENT (Dynamic Bidding) */}
        <TabsContent value="offers" className="space-y-6">
          {offerEntries.length > 0 && (
            <div className="grid md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Active offers</CardDescription>
                  <CardTitle className="text-3xl">{offerSummary.count}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-slate-500">
                  Number of candidates currently in the offer stage.
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Average offer</CardDescription>
                  <CardTitle className="text-3xl">
                    {offerSummary.average > 0 ? offerSummary.average.toLocaleString() : "—"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-slate-500">
                  Mean value of all offers you have sent.
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Market average</CardDescription>
                  <CardTitle className="text-3xl">
                    {offerSummary.marketAverage > 0 ? offerSummary.marketAverage.toLocaleString() : "No data"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-slate-500">
                  Average of top competing offers for these candidates.
                </CardContent>
              </Card>
            </div>
          )}
          {offerEntries.map(candidate => {
            const marketOffer = candidate.marketOffer || 0;
            const yourOffer = candidate.yourOffer || 0;
            const isWinning = yourOffer > marketOffer;
            const gap = yourOffer - marketOffer;
            const offerCount = candidate.offerCount ?? 0;
            const competitorAverage = candidate.averageCompetitorOffer ?? 0;

            const statusLabel =
              candidate.status === "offer_accepted"
                ? "Accepted"
                : candidate.status === "offer_rejected"
                  ? "Rejected"
                  : "Pending";

            return (
              <Card key={candidate.matchId} className="border-2 border-slate-100 overflow-hidden">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={candidate.avatar} />
                        <AvatarFallback>{candidate.name[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle>{candidate.name}</CardTitle>
                        <CardDescription>
                          {candidate.role} · {candidate.jobTitle || "Open role"}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge
                      variant={isWinning ? "default" : "destructive"}
                      className={isWinning ? "bg-green-600" : ""}
                    >
                      {statusLabel} · {isWinning ? "Leading" : "Trailing"}
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
                          <p className="text-3xl font-bold text-red-700">
                            {marketOffer > 0 ? `$${marketOffer.toLocaleString()}` : "No competing offers"}
                          </p>
                        </div>
                        <TrendingUp className="w-8 h-8 text-red-300" />
                      </div>

                      <div className={`flex justify-between items-center p-4 rounded-xl border ${isWinning ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-200'}`}>
                        <div>
                          <p className={`text-sm font-medium mb-1 ${isWinning ? 'text-emerald-600' : 'text-slate-500'}`}>Your Current Offer</p>
                          <p className={`text-3xl font-bold ${isWinning ? 'text-emerald-700' : 'text-slate-700'}`}>
                            ${yourOffer.toLocaleString()}
                          </p>
                          {candidate.offerMessage && (
                            <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                              {candidate.offerMessage}
                            </p>
                          )}
                        </div>
                        {isWinning ? <CheckCircle2 className="w-8 h-8 text-emerald-300" /> : <AlertCircle className="w-8 h-8 text-slate-300" />}
                      </div>

                      <div className="grid grid-cols-3 gap-3 text-sm text-slate-500 px-2">
                        <div>
                          <p className="uppercase tracking-wide text-[11px] text-slate-400">Gap</p>
                          <p className={gap > 0 ? "text-green-600 font-bold" : "text-red-600 font-bold"}>
                            {gap > 0 ? "+" : ""}
                            {gap.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="uppercase tracking-wide text-[11px] text-slate-400">Competitors</p>
                          <p className="font-semibold text-slate-700">{offerCount}</p>
                        </div>
                        <div>
                          <p className="uppercase tracking-wide text-[11px] text-slate-400">Avg competitor</p>
                          <p className="font-semibold text-slate-700">
                            {competitorAverage > 0 ? `$${Math.round(competitorAverage).toLocaleString()}` : "N/A"}
                          </p>
                        </div>
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
                              value={offerDrafts[candidate.matchId] ?? ""}
                              onChange={(e) =>
                                setOfferDrafts((prev) => ({ ...prev, [candidate.matchId]: e.target.value }))
                              }
                            />
                          </div>
                          <Button
                            size="lg"
                            onClick={() => handleUpdateOffer(candidate.matchId)}
                            className="bg-slate-900 text-white hover:bg-slate-800"
                          >
                            Update Offer
                          </Button>
                        </div>
                      </div>

                      <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-700 flex gap-2">
                        <Info className="w-5 h-5 flex-shrink-0" />
                        <p>
                          Competing with {offerCount} other offer(s). Average competitor offer:{" "}
                          {competitorAverage > 0 ? (
                            <span className="font-bold">${Math.round(competitorAverage).toLocaleString()}</span>
                          ) : (
                            <span className="font-bold">No data</span>
                          )}
                        </p>
                      </div>

                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {offerEntries.length === 0 && (
            <div className="text-center py-12 text-slate-500 border-2 border-dashed rounded-xl">
              No active offers.
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog
        open={interviewDialogOpen}
        onOpenChange={(open) => {
          setInterviewDialogOpen(open);
          if (!open) {
            resetInterviewDialog();
          }
        }}
      >
        <DialogContent className="sm:max-w-[640px]">
          <DialogHeader>
            <DialogTitle>Setup AI Interview</DialogTitle>
            <DialogDescription>
              Enter the questions for the candidate; the system will read them in order. After saving, the candidate will receive the AI interview link.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
            {questionList.map((question, index) => (
              <div key={index} className="flex items-start gap-3">
                <span className="mt-3 text-sm text-slate-500">{index + 1}.</span>
                <div className="flex-1">
                  <Input
                    value={question}
                    onChange={(e) => handleQuestionChange(index, e.target.value)}
                    placeholder="Type your interview question"
                    className="border-slate-200"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-slate-400 hover:text-red-600"
                  onClick={() => handleRemoveQuestion(index)}
                  disabled={questionList.length <= 1}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={handleAddQuestion}
              className="w-full border-dashed border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add question
            </Button>
          </div>
          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button type="button" variant="ghost" onClick={resetInterviewDialog} disabled={isScheduling}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="button" onClick={handleSubmitInterview} disabled={isScheduling}>
              {isScheduling && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save & Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={offerDialogOpen}
        onOpenChange={(open) => {
          setOfferDialogOpen(open);
          if (!open) {
            resetOfferDialog();
          }
        }}
      >
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Send Offer</DialogTitle>
            <DialogDescription>
              Provide a numeric offer and an optional note to reach the candidate.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-700">Amount</p>
              <Input
                placeholder="150000"
                value={offerForm.amount}
                onChange={(e) => setOfferForm((prev) => ({ ...prev, amount: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-700">Message</p>
              <Textarea
                rows={3}
                placeholder="Add a short note for the candidate (optional)"
                value={offerForm.message}
                onChange={(e) => setOfferForm((prev) => ({ ...prev, message: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button type="button" variant="ghost" onClick={resetOfferDialog} disabled={isSubmittingOffer}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="button" onClick={submitOffer} disabled={isSubmittingOffer}>
              {isSubmittingOffer && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Send Offer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
