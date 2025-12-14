"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Archive,
  CheckCircle2,
  Eye,
  Plus,
  Search,
  Sparkles,
  Users
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

interface Job {
  id: string;
  title: string;
  applicants: number;
  matches: number;
  views: number;
  status: 'active' | 'closed';
  postedAt: string;
}

const INITIAL_JOBS: Job[] = [];

import { useCompany } from "../context";

export default function JobsPage() {
  const router = useRouter();
  const { companyData } = useCompany();
  const [jobs, setJobs] = useState<Job[]>(INITIAL_JOBS);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // New Job Form State
  const [formData, setFormData] = useState({
    title: "",
    salary: "",
    description: ""
  });

  const handleAutoFill = () => {
    setFormData({
      title: "Senior Product Manager",
      salary: "$140k - $190k",
      description: "We are looking for an experienced PM to lead our core AI product initiatives. You will work closely with engineering and design to define the roadmap and execute on the vision."
    });
    toast.success("AI Generated Job Details", {
      description: "Form populated with optimized content."
    });
  };

  const handlePostJob = () => {
    const newJob: Job = {
      id: Date.now().toString(),
      title: formData.title || "Untitled Position",
      applicants: 0,
      matches: 0,
      views: 0,
      status: "active",
      postedAt: "Just now"
    };

    setJobs([newJob, ...jobs]);
    setIsDialogOpen(false);
    setFormData({ title: "", salary: "", description: "" });

    toast.success("Job Posted Successfully", {
      description: "You can now start matching with candidates."
    });
  };

  const toggleStatus = (id: string) => {
    setJobs(jobs.map(job =>
      job.id === id
        ? { ...job, status: job.status === 'active' ? 'closed' : 'active' }
        : job
    ));
    toast("Status Updated");
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Badge variant="outline" className="mb-2 border-emerald-200 text-emerald-700 bg-emerald-50">
            {companyData?.name || "Company"}
          </Badge>
          <h1 className="text-3xl font-bold text-slate-900">Job Management</h1>
          <p className="text-slate-500 mt-2">Manage your open positions and track candidate pipelines.</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200">
              <Plus className="w-5 h-5 mr-2" />
              Post New Job
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Post a New Job</DialogTitle>
              <DialogDescription>
                Create a new position. Use AI to auto-fill the description.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-6 py-4">
              <div className="flex justify-end">
                <Button
                  type="button"
                  onClick={handleAutoFill}
                  variant="outline"
                  className="bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  AI Auto-Fill
                </Button>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="title">Job Title</Label>
                <Input
                  id="title"
                  placeholder="e.g. Senior Frontend Engineer"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="salary">Salary Range</Label>
                <Input
                  id="salary"
                  placeholder="e.g. $120k - $160k"
                  value={formData.salary}
                  onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Job requirements and responsibilities..."
                  className="min-h-[150px]"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="submit" onClick={handlePostJob} className="bg-emerald-600 hover:bg-emerald-700 w-full">
                Post Job
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Jobs Grid */}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
        {jobs.map((job) => (
          <Card key={job.id} className={`hover:shadow-lg transition-all border-l-4 ${job.status === 'active' ? 'border-l-emerald-500' : 'border-l-slate-300'}`}>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl font-bold text-slate-900">{job.title}</CardTitle>
                  <p className="text-xs text-slate-500 mt-1">Posted {job.postedAt}</p>
                </div>
                <Badge variant={job.status === 'active' ? 'default' : 'secondary'} className={job.status === 'active' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' : ''}>
                  {job.status === 'active' ? 'Active' : 'Closed'}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="pb-3">
              <div className="grid grid-cols-3 gap-2 py-4 border-y border-slate-100">
                <div className="text-center group cursor-pointer" onClick={() => router.push('/company/tracker')}>
                  <div className="flex items-center justify-center gap-1 text-slate-500 mb-1 group-hover:text-blue-600">
                    <Users className="w-4 h-4" />
                  </div>
                  <p className="font-bold text-lg text-slate-900 group-hover:text-blue-600">{job.applicants}</p>
                  <p className="text-xs text-slate-500">Applicants</p>
                </div>
                <div className="text-center group cursor-pointer" onClick={() => router.push('/company/talent-radar')}>
                  <div className="flex items-center justify-center gap-1 text-slate-500 mb-1 group-hover:text-emerald-600">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <p className="font-bold text-lg text-emerald-600 group-hover:text-emerald-700">{job.matches}</p>
                  <p className="text-xs text-emerald-600 font-medium">AI Matches</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-slate-500 mb-1">
                    <Eye className="w-4 h-4" />
                  </div>
                  <p className="font-bold text-lg text-slate-900">{job.views}</p>
                  <p className="text-xs text-slate-500">Views</p>
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex justify-between items-center pt-4">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => toggleStatus(job.id)}>
                  {job.status === 'active' ? <Archive className="w-4 h-4 text-slate-400" /> : <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                </Button>
              </div>

              <div className="flex gap-2">
                <Button variant="ghost" size="sm">Edit</Button>
                <Button
                  size="sm"
                  className="bg-slate-900 hover:bg-slate-800 text-white"
                  onClick={() => router.push('/company/talent-radar')}
                >
                  Find Talent
                  <Search className="w-3 h-3 ml-2" />
                </Button>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}

