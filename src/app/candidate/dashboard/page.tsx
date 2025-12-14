"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Briefcase, DollarSign, MapPin, Pencil, Plus, Radar as RadarIcon, Sparkles, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  RadarChart,
  Radar as RadarShape,
  ResponsiveContainer
} from "recharts";

// Default skill data (if not from Onboarding)
const DEFAULT_SKILLS: SkillPoint[] = [];

interface Experience {
  id: string;
  role: string;
  company: string;
  period: string;
  description: string;
}

interface SkillPoint {
  subject: string;
  A: number;
  fullMark?: number;
}

interface UserProfile {
  name: string;
  role: string;
  summary: string;
  skills: SkillPoint[];
  experiences?: Experience[];
}

const normalizeSkills = (skills: any): SkillPoint[] => {
  if (!Array.isArray(skills) || skills.length === 0) return DEFAULT_SKILLS;

  const clampedSkills = skills
    .map((skill: any, index: number) => {
      const subject = skill.subject || skill.name || skill.category || `Skill ${index + 1}`;
      const rawLevel = skill.A ?? skill.level ?? skill.score ?? 0;
      const level = Number.isFinite(rawLevel) ? rawLevel : 0;
      const boundedLevel = Math.max(0, Math.min(100, level));

      return subject
        ? { subject, A: boundedLevel, fullMark: 100 }
        : null;
    })
    .filter(Boolean) as SkillPoint[];

  return clampedSkills.length > 0 ? clampedSkills : DEFAULT_SKILLS;
};

const normalizeExperiences = (experiences: any): Experience[] => {
  if (!Array.isArray(experiences)) return [];

  return experiences.map((exp: any, index: number) => ({
    id: exp.id || exp._id || `exp-${index}`,
    role: exp.role || exp.title || "Role",
    company: exp.company || exp.organization || "Company",
    period: exp.period || exp.duration || "",
    description: exp.description || exp.details || "",
  }));
};

const wrapPolarLabel = (value: string, maxPerLine = 18): string[] => {
  const words = value.split(/\s+/);
  const lines: string[] = [];
  let current = "";

  words.forEach((word) => {
    if ((current + " " + word).trim().length > maxPerLine) {
      lines.push(current.trim());
      current = word;
    } else {
      current = `${current} ${word}`.trim();
    }
  });

  if (current) lines.push(current);
  return lines;
};

const renderAngleTick = ({ payload, x, y }: any) => {
  const value = payload?.value ? String(payload.value) : "";
  const lines = wrapPolarLabel(value);

  return (
    <text x={x} y={y} textAnchor="middle" fill="#475569" fontSize={12}>
      {lines.map((line, index) => (
        <tspan key={index} x={x} dy={index === 0 ? 0 : 14}>
          {line}
        </tspan>
      ))}
    </text>
  );
};

export default function MyProfilePage() {
  const [profile, setProfile] = useState<UserProfile>({
    name: "Guest",
    role: "Explorer",
    summary: "Please complete your profile to see AI insights.",
    skills: DEFAULT_SKILLS,
    experiences: []
  });

  // State management: Job Preferences
  const [preferences, setPreferences] = useState({
    role: "Full Stack Developer",
    location: "Remote / NYC",
    salary: "$140k+"
  });
  const [isPrefDialogOpen, setIsPrefDialogOpen] = useState(false);
  const [tempPref, setTempPref] = useState(preferences);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // State management: Work experience
  const [experiences, setExperiences] = useState<Experience[]>([]);

  // Read data generated from Onboarding
  useEffect(() => {
    const savedProfile = localStorage.getItem('userProfile');
    if (savedProfile) {
      try {
        const parsed = JSON.parse(savedProfile);
        const normalizedSkills = normalizeSkills(parsed.skills);
        const normalizedExperiences = normalizeExperiences(parsed.experiences);

        setProfile((prev) => ({
          name: parsed.name || prev.name,
          role: parsed.role || prev.role,
          summary: parsed.summary || prev.summary,
          skills: normalizedSkills,
          experiences: normalizedExperiences
        }));

        // If we have experiences from AI, override the mock ones
        if (normalizedExperiences.length > 0) {
          setExperiences(normalizedExperiences);
        }
      } catch (e) {
        console.error("Failed to load profile", e);
      }
    }
  }, []);

  // Edit/add form state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentExp, setCurrentExp] = useState<Partial<Experience>>({});

  const handleDelete = (id: string) => {
    setExperiences(experiences.filter(exp => exp.id !== id));
  };

  const handleSave = () => {
    if (currentExp.id) {
      // Edit mode
      setExperiences(experiences.map(exp =>
        exp.id === currentExp.id ? { ...exp, ...currentExp } as Experience : exp
      ));
    } else {
      // Add mode
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

      {/* 1. Top area: Identity and strength */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Left: Personal information card */}
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
                          <Input value={tempPref.role} onChange={(e) => setTempPref({ ...tempPref, role: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                          <Label>Location</Label>
                          <Input value={tempPref.location} onChange={(e) => setTempPref({ ...tempPref, location: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                          <Label>Expected Salary</Label>
                          <Input value={tempPref.salary} onChange={(e) => setTempPref({ ...tempPref, salary: e.target.value })} />
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

        {/* Right: Radar chart */}
        <Card className="md:col-span-2 shadow-md border-0 bg-white/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RadarIcon className="w-5 h-5 text-blue-500" />
              Skill Radar
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart
                  cx="50%"
                  cy="50%"
                  outerRadius="80%"
                  data={profile.skills}
                  margin={{ top: 16, right: 32, bottom: 16, left: 32 }}
                >
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="subject" tick={renderAngleTick} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <RadarShape
                    name="Skill"
                    dataKey="A"
                    stroke="#2563eb"
                    strokeWidth={3}
                    fill="#3b82f6"
                    fillOpacity={0.3}
                  />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full flex items-center justify-center text-slate-400">
                Loading chart...
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 2. Middle area: AI summary */}
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

      {/* 3. Bottom area: Work experience */}
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
