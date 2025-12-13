"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function PostJobPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: "",
    salary: "",
    skills: "",
    description: ""
  });

  const handleAutoFill = () => {
    setFormData({
      title: "Senior AI Engineer",
      salary: "$180,000 - $250,000",
      skills: "Python, PyTorch, LLM, CUDA, Distributed Systems",
      description: "We are looking for an experienced AI Engineer to lead our core model training team. You will be responsible for designing and implementing large-scale training pipelines and optimizing inference performance. Experience with Transformer architectures is required."
    });
    toast.success("AI Generated Job Description", {
      description: "Form populated with high-quality content."
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Job Posted Successfully", {
      description: "Redirecting to Talent Radar to find candidates..."
    });
    setTimeout(() => {
      router.push("/company/talent-radar");
    }, 1500);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Post a New Job</h1>
        <p className="text-slate-500 mt-2">Create a job posting to start matching with top 1% talent.</p>
      </div>

      <Card className="border-emerald-100 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
          <div>
            <CardTitle>Job Details</CardTitle>
            <CardDescription>Fill in the details or let AI do it for you.</CardDescription>
          </div>
          <Button 
            onClick={handleAutoFill}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-md"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            AI Auto-Fill
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="title">Job Title</Label>
                <Input 
                  id="title" 
                  placeholder="e.g. Senior Frontend Engineer" 
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="salary">Salary Range</Label>
                <Input 
                  id="salary" 
                  placeholder="e.g. $150k - $200k" 
                  value={formData.salary}
                  onChange={(e) => setFormData({...formData, salary: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="skills">Required Skills (Comma separated)</Label>
              <Input 
                id="skills" 
                placeholder="React, Node.js, TypeScript..." 
                value={formData.skills}
                onChange={(e) => setFormData({...formData, skills: e.target.value})}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Job Description</Label>
              <Textarea 
                id="description" 
                placeholder="Describe the role and responsibilities..." 
                className="min-h-[200px]"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                required
              />
            </div>

            <div className="pt-4 flex justify-end">
              <Button type="submit" size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white px-8">
                Post Job & Find Talent
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

