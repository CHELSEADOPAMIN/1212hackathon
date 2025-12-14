import { Button } from "@/components/ui/button";
import { Briefcase, Radar, Sparkles, TrendingUp } from "lucide-react";
import Link from 'next/link';

export default function LandingPage() {
  return (
    <main className="min-h-screen w-full flex flex-col md:flex-row bg-background">
      {/* Candidates Section - Left Side */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 md:p-16 border-b md:border-b-0 md:border-r border-border relative overflow-hidden group hover:bg-slate-50/50 transition-colors">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center space-y-6 max-w-md">
          <div className="h-20 w-20 bg-blue-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
            <Radar className="h-10 w-10 text-blue-600" />
          </div>

          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            GeekHunter For Talent
          </h1>

          <p className="text-lg text-muted-foreground">
            Stop spamming resumes. Let AI match you with top 1% opportunities based on your real code and experience.
          </p>

          <div className="flex flex-col gap-4 w-full max-w-xs">
            <Link href="/candidate/onboarding" className="w-full">
              <Button size="lg" className="w-full text-lg px-8 py-6 rounded-full shadow-lg hover:shadow-xl transition-all">
                Start Assessment
                <Sparkles className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/candidate/dashboard" className="w-full">
              <Button variant="ghost" className="w-full text-slate-500 hover:text-slate-900">
                Already have an account? Sign In
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Companies Section - Right Side */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 md:p-16 relative overflow-hidden group hover:bg-slate-50/50 transition-colors">
        <div className="absolute inset-0 bg-gradient-to-bl from-emerald-500/5 to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center space-y-6 max-w-md">
          <div className="h-20 w-20 bg-emerald-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
            <TrendingUp className="h-10 w-10 text-emerald-600" />
          </div>

          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            GeekHunter For Hiring
          </h1>

          <p className="text-lg text-muted-foreground">
            Hire like trading stocks. See real skill scores and bid for top talent transparently.
          </p>

          <Link href="/company/onboarding">
            <Button variant="outline" size="lg" className="text-lg px-8 py-6 rounded-full border-2 hover:bg-accent transition-all">
              Start Hiring
              <Briefcase className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
