"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Building2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { useCompany } from "../context";

export default function CompanyAuthPage() {
  const router = useRouter();
  const { setCompanyData } = useCompany();

  // Steps: 0 = Email Check, 1 = Registration
  const [step, setStep] = useState(0);

  // Form State
  const [email, setEmail] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    industry: "",
    description: "",
    website: "",
    location: ""
  });

  const handleEmailCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsChecking(true);
    try {
      const res = await fetch("/api/auth/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, type: "company" }),
      });
      const data = await res.json();

      if (data.exists) {
        // Login successful
        localStorage.setItem('companyProfile', JSON.stringify(data.user));
        setCompanyData(data.user);
        toast.success("Welcome back!", { description: `Logged in as ${data.user.name}` });
        router.push('/company/jobs');
      } else {
        // Proceed to registration
        setStep(1);
        toast.info("Create your company profile");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error checking email");
    } finally {
      setIsChecking(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRegistering(true);

    try {
      const payload = {
        email,
        ...formData
      };

      const res = await fetch("/api/company/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        localStorage.setItem('companyProfile', JSON.stringify(data.data));
        setCompanyData(data.data);
        toast.success("Registration successful!");
        router.push('/company/jobs');
      } else {
        toast.error("Registration failed", { description: data.error || "Unknown error" });
      }
    } catch (error) {
      console.error(error);
      toast.error("Network error");
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 p-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/20 via-slate-950 to-slate-950 pointer-events-none" />

      <Card className="w-full max-w-md bg-slate-900 border-slate-800 text-slate-100 z-10">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2 text-emerald-400">
            <Building2 className="w-6 h-6" />
            GeekHunter for Business
          </CardTitle>
          <CardDescription className="text-slate-400">
            {step === 0 ? "Sign in or create an account to start hiring." : "Tell us about your company."}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {step === 0 ? (
            <form onSubmit={handleEmailCheck} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-200">Work Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="hr@company.com"
                  className="bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500 focus-visible:ring-emerald-500"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" disabled={!email.trim() || isChecking}>
                {isChecking ? <Loader2 className="w-4 h-4 animate-spin" /> : "Continue"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-slate-200">Company Name</Label>
                <Input
                  id="name"
                  placeholder="Acme Corp"
                  className="bg-slate-800 border-slate-700 text-slate-100"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="industry" className="text-slate-200">Industry</Label>
                <Input
                  id="industry"
                  placeholder="e.g. Fintech, AI, E-commerce"
                  className="bg-slate-800 border-slate-700 text-slate-100"
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location" className="text-slate-200">Location</Label>
                <Input
                  id="location"
                  placeholder="e.g. San Francisco, Remote"
                  className="bg-slate-800 border-slate-700 text-slate-100"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-slate-200">Short Description</Label>
                <Textarea
                  id="description"
                  placeholder="What does your company do?"
                  className="bg-slate-800 border-slate-700 text-slate-100 min-h-[80px]"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="ghost" onClick={() => setStep(0)} className="flex-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800">
                  Back
                </Button>
                <Button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white" disabled={isRegistering}>
                  {isRegistering ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Profile"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
