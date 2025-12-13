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
            Lyrathon For Talent
          </h1>

          <p className="text-lg text-muted-foreground">
            不再海投简历。让 AI 根据你的真实代码和经历，自动匹配前 1% 的机会。
          </p>

          <Link href="/candidate/onboarding">
            <Button size="lg" className="text-lg px-8 py-6 rounded-full shadow-lg hover:shadow-xl transition-all">
              开始 AI 评估
              <Sparkles className="ml-2 h-5 w-5" />
            </Button>
          </Link>
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
            Lyrathon For Hiring
          </h1>

          <p className="text-lg text-muted-foreground">
            竞价招聘。看到真实技能评分，像交易股票一样竞拍顶级人才。
          </p>

          <Link href="/company/discover">
            <Button variant="outline" size="lg" className="text-lg px-8 py-6 rounded-full border-2 hover:bg-accent transition-all">
              寻找人才
              <Briefcase className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
