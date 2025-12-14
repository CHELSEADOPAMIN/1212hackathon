"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, RefreshCw } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface RejectedMatch {
  _id: string;
  candidate: {
    name: string;
    role: string;
    avatar: string;
  };
  job: {
    title: string;
    company?: string;
  };
  status: string;
  updatedAt: string;
}

export default function RestorePage() {
  const [rejectedMatches, setRejectedMatches] = useState<RejectedMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchRejectedMatches();
  }, []);

  const fetchRejectedMatches = async () => {
    try {
      setLoading(true);
      // Get company ID
      const companyProfile = localStorage.getItem('companyProfile');
      if (!companyProfile) {
        toast.error("Please log in to your company account first");
        return;
      }

      const company = JSON.parse(companyProfile);
      const companyId = company._id || "demo-company";

      const res = await fetch(`/api/company/rejected-matches?companyId=${companyId}`);
      const data = await res.json();

      if (res.ok && data.success) {
        setRejectedMatches(data.data || []);
      } else {
        toast.error(data.error || "Failed to get rejected matches");
      }
    } catch (error) {
      console.error("Fetch rejected matches error:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (matchId: string) => {
    try {
      setRestoring(prev => ({ ...prev, [matchId]: true }));

      const res = await fetch("/api/match/restore", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        toast.success("Candidate has been restored to interested list");
        // 从列表中移除
        setRejectedMatches(prev => prev.filter(match => match._id !== matchId));
      } else {
        toast.error(data.error || "Restore failed");
      }
    } catch (error) {
      console.error("Restore error:", error);
      toast.error("Operation failed. Please try again later");
    } finally {
      setRestoring(prev => ({ ...prev, [matchId]: false }));
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <Link href="/company/tracker">
          <Button variant="outline" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Restore Rejected Candidates</h1>
          <p className="text-slate-500 mt-2">Restore candidate matches accidentally rejected during testing</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5" />
            Rejected Matches
          </CardTitle>
          <CardDescription>
            Here are all candidates you&rsquo;ve rejected (soft deleted). You can choose to restore them back to the interested list.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="text-center py-8 text-slate-500">
              Loading...
            </div>
          ) : rejectedMatches.length === 0 ? (
            <div className="text-center py-8 text-slate-500 border-2 border-dashed rounded-xl">
              <RefreshCw className="w-12 h-12 mx-auto mb-4 text-slate-300" />
              <p>No rejected matches found</p>
              <p className="text-sm">All candidates are still on your radar</p>
            </div>
          ) : (
            rejectedMatches.map((match) => (
              <div
                key={match._id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <Image
                    src={match.candidate.avatar || "https://github.com/shadcn.png"}
                    alt={match.candidate.name}
                    width={48}
                    height={48}
                    className="w-12 h-12 rounded-full"
                  />
                  <div>
                    <h3 className="font-semibold text-slate-900">{match.candidate.name}</h3>
                    <p className="text-sm text-slate-500">{match.candidate.role}</p>
                    <p className="text-xs text-slate-400">
                      {match.job.title} • {new Date(match.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="destructive">Rejected</Badge>
                  <Button
                    onClick={() => handleRestore(match._id)}
                    disabled={restoring[match._id]}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    {restoring[match._id] ? "Restoring..." : "Restore"}
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
