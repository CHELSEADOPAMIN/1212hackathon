"use client";

import { useState } from "react";
import { 
  Clock, Trash2, Video, CheckCircle, FileText, ChevronRight, XCircle, Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";

// 模拟数据
const PENDING_JOBS = [
  { id: 1, company: "Netflix", role: "Senior Engineer", status: "Waiting for Review", logo: "N" },
  { id: 2, company: "Apple", role: "UI Designer", status: "Waiting for Review", logo: "A" },
];

const INTERVIEW_JOBS = [
  { id: 3, company: "OpenAI", role: "AI Researcher", time: "Tomorrow, 10:00 AM", type: "AI Technical Interview" },
];

const OFFER_JOBS = [
  { id: 4, company: "Google", role: "Staff Engineer", salary: "$285,000", status: "Offer Pending Acceptance", expires: "2 days left" },
];

export default function ApplicationsPage() {
  const [pendings, setPendings] = useState(PENDING_JOBS);

  const removePending = (id: number) => {
    setPendings(pendings.filter(j => j.id !== id));
    toast("Application removed", {
      description: "You have withdrawn your interest.",
    });
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Application Tracker</h1>
        <p className="text-slate-500 mt-2">Track your progress from interest to offer.</p>
      </div>

      <div className="grid gap-8">
        
        {/* SECTION 1: OFFERS (Priority) */}
        {OFFER_JOBS.length > 0 && (
          <div className="space-y-4">
             <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-green-600" />
              Offers Received
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {OFFER_JOBS.map(job => (
                <Card key={job.id} className="border-2 border-green-500 bg-green-50/30">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-2xl text-green-900">{job.company}</CardTitle>
                        <CardDescription className="text-green-700 font-medium">{job.role}</CardDescription>
                      </div>
                      <Badge className="bg-green-600 hover:bg-green-700">{job.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 bg-white rounded-lg border border-green-200 shadow-sm text-center">
                       <p className="text-sm text-slate-500 mb-1">Total Compensation</p>
                       <p className="text-3xl font-bold text-green-700">{job.salary}</p>
                    </div>
                    <p className="text-sm text-red-500 font-medium text-center">
                      Expires in {job.expires}
                    </p>
                  </CardContent>
                  <CardFooter className="flex gap-3">
                    <Button variant="outline" className="flex-1 border-green-200 hover:bg-green-100 text-green-800">
                      View Letter
                    </Button>
                    <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                      Accept Offer
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* SECTION 2: INTERVIEWS */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Video className="w-6 h-6 text-blue-600" />
            Upcoming Interviews
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {INTERVIEW_JOBS.map(job => (
              <Card key={job.id} className="border-2 border-blue-100 shadow-md">
                <CardHeader>
                   <CardTitle>{job.company}</CardTitle>
                   <CardDescription>{job.role}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                      <Clock className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{job.time}</p>
                      <p className="text-sm text-slate-500">{job.type}</p>
                    </div>
                  </div>
                  <Button size="lg" className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200">
                    Start AI Interview
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* SECTION 3: PENDING */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-6 h-6 text-slate-400" />
            Pending Applications
          </h2>
          <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
            {pendings.map(job => (
              <div key={job.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center font-bold text-slate-500">
                    {job.logo}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{job.role}</h3>
                    <p className="text-sm text-slate-500">{job.company}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant="outline" className="text-slate-500 border-slate-200 hidden sm:flex">
                    {job.status}
                  </Badge>
                  <Button variant="ghost" size="icon" onClick={() => removePending(job.id)}>
                    <Trash2 className="w-4 h-4 text-slate-300 hover:text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
            {pendings.length === 0 && (
              <div className="p-8 text-center text-slate-400">
                No pending applications. Swipe some more!
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

