"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Sparkles, Target } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface CandidateMatch {
  _id?: string;
  name: string;
  role: string;
  summary: string;
  skills: { name?: string; level?: number; category?: string }[];
  score?: number;
}

export default function Discover() {
  const [form, setForm] = useState({
    title: "",
    location: "",
    type: "",
    requirements: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<CandidateMatch[]>([]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResults([]);

    try {
      const requirements = form.requirements
        .split(",")
        .map((r) => r.trim())
        .filter(Boolean);

      const res = await fetch("/api/recommendations/candidates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job: {
            title: form.title,
            description: form.description,
            requirements,
            location: form.location,
            type: form.type,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to search candidates");
      }

      setResults(data.matches || []);
      if (!data.matches || data.matches.length === 0) {
        toast.info("No candidates found yet. Try broadening the requirements.");
      }
    } catch (error: unknown) {
      console.error(error);
      const message = error instanceof Error ? error.message : "Failed to search candidates";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-10 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Company Discover</h1>
          <p className="mt-2 text-muted-foreground">
            Enter job description, AI will find the best matching candidates from the talent pool.
          </p>
        </div>
        <Badge variant="secondary" className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          AI Match
        </Badge>
      </div>

      <Card className="shadow-lg border-emerald-100">
        <CardHeader>
          <CardTitle>Job Description</CardTitle>
          <CardDescription>The more specific the requirements, the higher the matching degree.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSearch}>
            <div className="grid md:grid-cols-2 gap-4">
              <Input
                placeholder="Job Title (e.g. Senior Frontend Engineer)"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
              <Input
                placeholder="Location / Remote"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <Input
                placeholder="Employment Type (Full-time, Contract...)"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              />
              <Input
                placeholder="Key skills (comma separated)"
                value={form.requirements}
                onChange={(e) =>
                  setForm({ ...form, requirements: e.target.value })
                }
              />
            </div>
            <Textarea
              placeholder="Describe the role, responsibilities and expectations..."
              className="min-h-[160px]"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              required
            />
            <Button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Searching...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Find Candidates
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <div className="grid md:grid-cols-2 gap-6">
          {results.map((candidate) => {
            const key = candidate._id ? candidate._id.toString() : candidate.name;
            return (
              <Card key={key} className="shadow-md">
                <CardHeader className="space-y-1">
                  <div className="flex items-center justify-between">
                    <CardTitle>{candidate.name}</CardTitle>
                    {typeof candidate.score === "number" && (
                      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                        {Math.round(candidate.score * 100)}% match
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="flex items-center gap-2 text-slate-600">
                    <Target className="w-4 h-4" />
                    {candidate.role}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-slate-700 leading-relaxed">{candidate.summary}</p>
                  <div className="flex flex-wrap gap-2">
                    {candidate.skills?.slice(0, 6).map((skill, idx) => (
                      <Badge key={`${candidate._id}-${skill.name ?? idx}`} variant="secondary">
                        {skill.name}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {!loading && results.length === 0 && (
        <div className="text-sm text-muted-foreground">
          After submitting the job, you can get the AI recommended candidate list.
        </div>
      )}
    </div>
  );
}
