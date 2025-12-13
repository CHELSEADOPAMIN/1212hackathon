"use client";

import { useState } from "react";
import { 
  Play, Pause, ThumbsUp, ThumbsDown, DollarSign, TrendingUp, Send, CheckCircle2, AlertCircle, BrainCircuit, Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { useCompany, Candidate } from "../context";

export default function ProcessTrackerPage() {
  const { 
    interested, interviews, offers, 
    moveToInterview, moveToOffer, updateOffer 
  } = useCompany();
  
  // 视频播放状态 mock
  const [isPlaying, setIsPlaying] = useState(false);

  // 竞价输入状态
  const [offerInput, setOfferInput] = useState<string>("");

  const handleSendInterview = (id: string) => {
    moveToInterview(id);
    toast.success("AI Interview Invite Sent", {
      description: "Candidate has been notified."
    });
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
          <TabsTrigger value="interested">Interested ({interested.length})</TabsTrigger>
          <TabsTrigger value="interviews">Interview Review ({interviews.length})</TabsTrigger>
          <TabsTrigger value="offers">Offer Management ({offers.length})</TabsTrigger>
        </TabsList>

        {/* TAB 1: INTERESTED */}
        <TabsContent value="interested" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {interested.map(candidate => (
              <Card key={candidate.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center gap-4">
                  <Avatar>
                    <AvatarImage src={candidate.avatar} />
                    <AvatarFallback>{candidate.name[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">{candidate.name}</CardTitle>
                    <CardDescription>{candidate.role}</CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {candidate.skills.slice(0, 3).map(s => (
                      <Badge key={s.subject} variant="secondary">{s.subject}</Badge>
                    ))}
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="w-full bg-slate-900 text-white hover:bg-slate-800">
                        Setup AI Interview
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Customize AI Interview</DialogTitle>
                        <DialogDescription>
                          AI has generated 3 questions based on {candidate.name}'s profile.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                         <div className="bg-slate-50 p-4 rounded-lg space-y-2 border">
                           <p className="text-sm font-medium">1. Explain how you optimized the rendering performance in your React project.</p>
                           <p className="text-sm font-medium">2. Describe a time you had to make a tradeoff between code quality and speed.</p>
                           <p className="text-sm font-medium">3. How do you handle state management in large scale applications?</p>
                         </div>
                      </div>
                      <DialogFooter>
                        <Button onClick={() => handleSendInterview(candidate.id)} className="bg-emerald-600 hover:bg-emerald-700">
                          <Send className="w-4 h-4 mr-2" />
                          Confirm & Send Invite
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            ))}
             {interested.length === 0 && (
              <div className="col-span-full text-center py-12 text-slate-500 border-2 border-dashed rounded-xl">
                No candidates yet. Go to Talent Radar to find some!
              </div>
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

