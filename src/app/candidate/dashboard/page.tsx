"use client";

import { useState, useEffect } from "react";
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer 
} from 'recharts';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, Pencil, Trash2, Briefcase, Sparkles, MapPin, DollarSign } from "lucide-react";

// 默认技能数据（如果没有从 Onboarding 过来）
const DEFAULT_SKILLS = [
  { subject: 'Coding', A: 95, fullMark: 100 },
  { subject: 'System Design', A: 88, fullMark: 100 },
  { subject: 'Leadership', A: 75, fullMark: 100 },
  { subject: 'Product Sense', A: 85, fullMark: 100 },
  { subject: 'Communication', A: 80, fullMark: 100 },
];

interface Experience {
  id: string;
  role: string;
  company: string;
  period: string;
  description: string;
}

interface UserProfile {
  name: string;
  role: string;
  summary: string;
  skills: { subject: string; A: number }[];
  experiences?: Experience[];
}

export default function MyProfilePage() {
  const [profile, setProfile] = useState<UserProfile>({
    name: "Alex Chen",
    role: "Senior Full Stack Developer",
    summary: "Alex demonstrates exceptional proficiency in full-stack development...",
    skills: DEFAULT_SKILLS,
    experiences: []
  });

  // 状态管理：Job Preferences
  const [preferences, setPreferences] = useState({
    role: "Full Stack Developer",
    location: "Remote / NYC",
    salary: "$140k+"
  });
  const [isPrefDialogOpen, setIsPrefDialogOpen] = useState(false);
  const [tempPref, setTempPref] = useState(preferences);

  // 状态管理：工作经历
  const [experiences, setExperiences] = useState<Experience[]>([
    {
      id: "1",
      role: "Senior Full Stack Developer",
      company: "TechGiant Corp",
      period: "2021 - Present",
      description: "Led the migration of legacy monolith to microservices architecture. Improved system reliability by 99.9% and reduced deployment time by 50%."
    },
    {
      id: "2",
      role: "Frontend Engineer",
      company: "StartupInc",
      period: "2019 - 2021",
      description: "Built the core product dashboard using React and TypeScript. Collaborated closely with design team to implement pixel-perfect UI."
    }
  ]);

  // 读取 Onboarding 产生的数据
  useEffect(() => {
    const savedProfile = localStorage.getItem('userProfile');
    if (savedProfile) {
      try {
        const parsed = JSON.parse(savedProfile);
        setProfile({
          name: parsed.name,
          role: parsed.role,
          summary: parsed.summary,
          skills: parsed.skills,
          experiences: parsed.experiences
        });
        
        // If we have experiences from AI, override the mock ones
        if (parsed.experiences && parsed.experiences.length > 0) {
          // Assign IDs if missing
          const experiencesWithIds = parsed.experiences.map((exp: any, index: number) => ({
            ...exp,
            id: exp.id || `ai-${index}`
          }));
          setExperiences(experiencesWithIds);
        }
      } catch (e) {
        console.error("Failed to load profile", e);
      }
    }
  }, []);

  // 编辑/新增表单状态
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentExp, setCurrentExp] = useState<Partial<Experience>>({});

  const handleDelete = (id: string) => {
    setExperiences(experiences.filter(exp => exp.id !== id));
  };

  const handleSave = () => {
    if (currentExp.id) {
      // 编辑模式
      setExperiences(experiences.map(exp => 
        exp.id === currentExp.id ? { ...exp, ...currentExp } as Experience : exp
      ));
    } else {
      // 新增模式
      setExperiences([
        ...experiences, 
        { ...currentExp, id: Date.now().toString() } as Experience
      ]);
    }
    setIsDialogOpen(false);
    setCurrentExp({});
  };

  const handleSavePreferences = () => {
    setPreferences(tempPref);
    setIsPrefDialogOpen(false);
  };

  const openEdit = (exp: Experience) => {
    setCurrentExp(exp);
    setIsDialogOpen(true);
  };

  const openAdd = () => {
    setCurrentExp({});
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto animate-in fade-in duration-500">
      
      {/* 1. 顶部区域：身份与战力 */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* 左侧：个人信息卡片 */}
        <Card className="md:col-span-1 shadow-md border-0 bg-white/80 backdrop-blur">
          <CardContent className="pt-8 flex flex-col items-center text-center space-y-4">
            <div className="relative">
              <Avatar className="w-32 h-32 border-4 border-white shadow-xl">
                <AvatarImage src="https://github.com/shadcn.png" />
                <AvatarFallback>{profile.name[0]}</AvatarFallback>
              </Avatar>
              <Badge className="absolute bottom-0 right-0 bg-green-500 hover:bg-green-600 border-2 border-white">
                Available
              </Badge>
            </div>
            <div className="w-full">
              <h2 className="text-2xl font-bold text-slate-900">{profile.name}</h2>
              <p className="text-blue-600 font-medium">{profile.role}</p>
              
              {/* Job Preferences Section */}
              <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Job Preferences</span>
                  <Dialog open={isPrefDialogOpen} onOpenChange={setIsPrefDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-blue-600" onClick={() => setTempPref(preferences)}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Job Preferences</DialogTitle>
                        <DialogDescription>Set your career expectations.</DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                         <div className="space-y-2">
                           <Label>Target Role</Label>
                           <Input value={tempPref.role} onChange={(e) => setTempPref({...tempPref, role: e.target.value})} />
                         </div>
                         <div className="space-y-2">
                           <Label>Location</Label>
                           <Input value={tempPref.location} onChange={(e) => setTempPref({...tempPref, location: e.target.value})} />
                         </div>
                         <div className="space-y-2">
                           <Label>Expected Salary</Label>
                           <Input value={tempPref.salary} onChange={(e) => setTempPref({...tempPref, salary: e.target.value})} />
                         </div>
                      </div>
                      <DialogFooter>
                        <Button onClick={handleSavePreferences}>Save Preferences</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
                
                <div className="flex flex-wrap gap-2 justify-center">
                  <Badge variant="outline" className="flex items-center gap-1 border-slate-200 text-slate-600">
                    <Briefcase className="w-3 h-3" />
                    {preferences.role}
                  </Badge>
                  <Badge variant="outline" className="flex items-center gap-1 border-slate-200 text-slate-600">
                    <MapPin className="w-3 h-3" />
                    {preferences.location}
                  </Badge>
                  <Badge variant="outline" className="flex items-center gap-1 border-slate-200 text-slate-600">
                    <DollarSign className="w-3 h-3" />
                    {preferences.salary}
                  </Badge>
                </div>
              </div>

            </div>
            <div className="flex flex-wrap gap-2 justify-center pt-2">
              <Badge variant="secondary">React</Badge>
              <Badge variant="secondary">Node.js</Badge>
              <Badge variant="secondary">AWS</Badge>
              <Badge variant="secondary">Python</Badge>
            </div>
          </CardContent>
        </Card>

        {/* 右侧：雷达图 */}
        <Card className="md:col-span-2 shadow-md border-0 bg-white/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Radar className="w-5 h-5 text-blue-500" />
              Skill Radar
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={profile.skills}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 12 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar
                  name="Skill"
                  dataKey="A"
                  stroke="#2563eb"
                  strokeWidth={3}
                  fill="#3b82f6"
                  fillOpacity={0.3}
                />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* 2. 中部区域：AI 总结 */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-700">
            <Sparkles className="w-5 h-5" />
            AI Executive Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-700 leading-relaxed text-lg">
            {profile.summary}
          </p>
        </CardContent>
      </Card>

      {/* 3. 底部区域：工作经历 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Briefcase className="w-5 h-5" />
            Professional Experience
          </h3>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openAdd} className="bg-slate-900 text-white hover:bg-slate-800">
                <Plus className="w-4 h-4 mr-2" />
                Add Experience
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>{currentExp.id ? "Edit Experience" : "Add Experience"}</DialogTitle>
                <DialogDescription>
                  Update your professional journey here.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="role" className="text-right">
                    Role
                  </Label>
                  <Input
                    id="role"
                    value={currentExp.role || ""}
                    onChange={(e) => setCurrentExp({ ...currentExp, role: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="company" className="text-right">
                    Company
                  </Label>
                  <Input
                    id="company"
                    value={currentExp.company || ""}
                    onChange={(e) => setCurrentExp({ ...currentExp, company: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="period" className="text-right">
                    Period
                  </Label>
                  <Input
                    id="period"
                    value={currentExp.period || ""}
                    onChange={(e) => setCurrentExp({ ...currentExp, period: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    value={currentExp.description || ""}
                    onChange={(e) => setCurrentExp({ ...currentExp, description: e.target.value })}
                    className="col-span-3"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" onClick={handleSave}>Save changes</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4">
          {experiences.map((exp) => (
            <Card key={exp.id} className="group hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="text-lg font-bold text-slate-900">{exp.role}</h4>
                    <div className="text-sm text-slate-500 font-medium flex gap-2 items-center mt-1">
                      <span className="text-slate-900">{exp.company}</span>
                      <span>•</span>
                      <span>{exp.period}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(exp)}>
                      <Pencil className="w-4 h-4 text-slate-400 hover:text-blue-600" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(exp.id)}>
                      <Trash2 className="w-4 h-4 text-slate-400 hover:text-red-600" />
                    </Button>
                  </div>
                </div>
                <p className="text-slate-600 text-sm leading-relaxed">
                  {exp.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
