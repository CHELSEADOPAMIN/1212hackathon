"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { MatchStatus } from "@/lib/types";
import {
  CalendarClock,
  CheckCircle,
  ChevronRight,
  Clock,
  FileText,
  Trash2,
  Video,
} from "lucide-react";
import { toast } from "sonner";

type MatchRecord = {
  _id?: string;
  status: MatchStatus;
  job?: {
    title?: string;
    company?: string;
    salary?: string;
    location?: string;
    type?: string;
  } | null;
  jobSnapshot?: {
    title?: string;
    company?: string;
    salary?: string;
    location?: string;
    type?: string;
  } | null;
  updatedAt?: string;
};

type InterviewRecord = MatchRecord & {
  candidate?: any;
};

interface OfferCard {
  id: string;
  company: string;
  role: string;
  salary: string;
  expiresLabel: string;
}

interface PendingCard {
  id: string;
  company: string;
  role: string;
  status: MatchStatus;
}

interface InterviewCard {
  id: string;
  company: string;
  role: string;
  time: string;
  type: string;
  status: MatchStatus;
}

const toStringId = (value: any) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (value?.toString) return value.toString();
  return "";
};

const getJobInfo = (match: MatchRecord) => {
  return match.job || match.jobSnapshot || {};
};

const buildExpiryLabel = (updatedAt?: string) => {
  const base = updatedAt ? new Date(updatedAt) : new Date();
  const deadline = new Date(base.getTime() + 7 * 24 * 60 * 60 * 1000);
  const diffMs = deadline.getTime() - Date.now();
  const days = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  return days > 0 ? `Expires in ${days}d` : "Expires soon";
};

export default function ApplicationsPage() {
  const [offers, setOffers] = useState<OfferCard[]>([]);
  const [pendingApps, setPendingApps] = useState<PendingCard[]>([]);
  const [interviews, setInterviews] = useState<InterviewCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [interviewLoading, setInterviewLoading] = useState(true);

  const candidateId = useMemo(() => {
    if (typeof window === "undefined") return "";
    const savedProfile = localStorage.getItem("userProfile");
    const profile = savedProfile ? JSON.parse(savedProfile) : null;
    return toStringId(profile?._id || profile?.id);
  }, []);

  useEffect(() => {
    if (!candidateId) {
      setLoading(false);
      setInterviewLoading(false);
      toast.error("未找到候选人信息，请先完成登录或入职引导。");
      return;
    }

    const fetchApplications = async () => {
      try {
        const res = await fetch(`/api/candidate/applications?candidateId=${candidateId}`);
        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.error || "无法加载申请数据");
        }

        const matches: MatchRecord[] = data.data || [];

        const nextOffers = matches
          .filter((m) => m.status === "matched")
          .map((m) => {
            const job = getJobInfo(m);
            return {
              id: toStringId(m._id),
              company: job.company || "Hiring Company",
              role: job.title || "Open Role",
              salary: job.salary || "TBD",
              expiresLabel: buildExpiryLabel(m.updatedAt),
            } as OfferCard;
          });

        const nextPending = matches
          .filter((m) => m.status === "candidate_interested" || m.status === "company_interested")
          .map((m) => {
            const job = getJobInfo(m);
            return {
              id: toStringId(m._id),
              company: job.company || "Hiring Company",
              role: job.title || "Open Role",
              status: m.status,
            } as PendingCard;
          });

        setOffers(nextOffers);
        setPendingApps(nextPending);
      } catch (error) {
        console.error("Load applications error:", error);
        toast.error("加载申请列表失败", {
          description: (error as Error).message,
        });
      } finally {
        setLoading(false);
      }
    };

    const fetchInterviews = async () => {
      try {
        const res = await fetch(`/api/candidate/interviews?candidateId=${candidateId}`);
        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.error || "无法加载面试数据");
        }

        const nextInterviews: InterviewCard[] = (data.data || []).map((item: InterviewRecord) => {
          const job = getJobInfo(item);
          return {
            id: toStringId((item as any)._id || crypto.randomUUID()),
            company: job.company || "Hiring Company",
            role: job.title || "Open Role",
            time: item.updatedAt ? new Date(item.updatedAt).toLocaleString() : "待安排",
            type: job.type || "AI Interview",
            status: item.status,
          };
        });

        setInterviews(nextInterviews);
      } catch (error) {
        console.error("Load interviews error:", error);
        toast.error("加载面试数据失败", {
          description: (error as Error).message,
        });
      } finally {
        setInterviewLoading(false);
      }
    };

    fetchApplications();
    fetchInterviews();
  }, [candidateId]);

  const handleWithdraw = async (matchId: string) => {
    try {
      const res = await fetch("/api/match/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId, status: "rejected_by_candidate", softDelete: true }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "撤销申请失败");
      }

      setPendingApps((prev) => prev.filter((item) => item.id !== matchId));
      toast.success("已撤销申请", { description: "该职位将不会再显示在列表中。" });
    } catch (error) {
      console.error("Withdraw error:", error);
      toast.error("撤销失败", { description: (error as Error).message });
    }
  };

  const handleStartInterview = (status: MatchStatus) => {
    if (status !== "interview_pending") {
      toast.info("HR 正在准备面试，请稍后再试。");
      return;
    }
    toast.success("启动 AI 面试...");
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto animate-in fade-in duration-500">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold text-slate-900">Application Tracker</h1>
        <p className="text-slate-500">从匹配到面试，全面掌握申请进度。</p>
      </div>

      {/* OFFERS */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <CheckCircle className="w-6 h-6 text-green-600" />
          Offers Received
          {offers.length > 0 && (
            <Badge className="bg-green-100 text-green-700 border-green-200">
              {offers.length} active
            </Badge>
          )}
        </h2>
        {loading ? (
          <div className="p-6 border border-dashed rounded-xl text-slate-400">Loading offers...</div>
        ) : offers.length === 0 ? (
          <div className="p-6 border border-dashed rounded-xl text-slate-400">
            暂无 Offer，继续探索机会。
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {offers.map((offer) => (
              <Card key={offer.id} className="border-2 border-green-500/50 bg-green-50/40">
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-2xl text-green-900">{offer.company}</CardTitle>
                      <CardDescription className="text-green-700 font-medium">
                        {offer.role}
                      </CardDescription>
                    </div>
                    <Badge className="bg-green-600 hover:bg-green-700">Offer</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-green-700" />
                    <span className="text-lg font-semibold text-green-800">{offer.salary}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-green-700">
                    <CalendarClock className="w-4 h-4" />
                    <span>{offer.expiresLabel}</span>
                  </div>
                </CardContent>
                <CardFooter className="flex gap-3">
                  <Button variant="outline" className="flex-1 border-green-200 hover:bg-green-100 text-green-800">
                    查看邀请函
                  </Button>
                  <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                    接受 Offer
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* INTERVIEWS */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Video className="w-6 h-6 text-blue-600" />
          Upcoming Interviews
        </h2>
        {interviewLoading ? (
          <div className="p-6 text-slate-500 border border-dashed rounded-xl text-center">
            Loading interview schedule...
          </div>
        ) : interviews.length === 0 ? (
          <div className="p-6 text-center text-slate-400 border border-dashed rounded-xl">
            暂无即将到来的面试，保持关注。
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {interviews.map((job) => (
              <Card key={job.id} className="border-2 border-blue-100 shadow-md">
                <CardHeader className="flex items-center justify-between">
                  <div>
                    <CardTitle>{job.company}</CardTitle>
                    <CardDescription>{job.role}</CardDescription>
                  </div>
                  <Badge
                    variant={job.status === "interview_pending" ? "default" : "secondary"}
                    className={
                      job.status === "interview_pending"
                        ? "bg-blue-600 hover:bg-blue-600"
                        : "bg-slate-100 text-slate-600"
                    }
                  >
                    {job.status === "interview_pending" ? "Ready" : "Waiting for HR"}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                      <Clock className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{job.time || "待安排"}</p>
                      <p className="text-sm text-slate-500">{job.type}</p>
                    </div>
                  </div>
                  <Button
                    size="lg"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200 disabled:opacity-70"
                    disabled={job.status !== "interview_pending"}
                    onClick={() => handleStartInterview(job.status)}
                  >
                    Start AI Interview
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* PENDING */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Clock className="w-6 h-6 text-slate-400" />
          Pending Applications
        </h2>
        {loading ? (
          <div className="p-6 border border-dashed rounded-xl text-slate-400">Loading applications...</div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
            {pendingApps.map((job) => (
              <div
                key={job.id}
                className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center font-bold text-slate-500">
                    {job.company.slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{job.role}</h3>
                    <p className="text-sm text-slate-500">{job.company}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant="outline" className="text-slate-500 border-slate-200 hidden sm:flex">
                    {job.status === "company_interested" ? "Company interested" : "Waiting for company"}
                  </Badge>
                  <Button variant="ghost" size="icon" onClick={() => handleWithdraw(job.id)}>
                    <Trash2 className="w-4 h-4 text-slate-300 hover:text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
            {pendingApps.length === 0 && (
              <div className="p-8 text-center text-slate-400">
                No pending applications. Swipe some more!
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
