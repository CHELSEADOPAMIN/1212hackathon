"use client";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Briefcase, Kanban, LogOut, Menu, Radar, TrendingUp } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { CompanyProvider } from "./context";

const sidebarItems = [
  {
    title: "My Jobs",
    href: "/company/jobs",
    icon: Briefcase,
  },
  {
    title: "Talent Radar",
    href: "/company/talent-radar",
    icon: Radar,
  },
  {
    title: "Process Tracker",
    href: "/company/tracker",
    icon: Kanban,
  },
];

export default function CompanyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isOnboarding = pathname?.startsWith('/company/onboarding');
  const [isOpen, setIsOpen] = useState(false);

  if (isOnboarding) {
    return (
      <CompanyProvider>
        <div className="min-h-screen bg-slate-950">
          {children}
        </div>
      </CompanyProvider>
    );
  }

  return (
    <CompanyProvider>
      <div className="flex min-h-screen bg-slate-50">
        {/* Mobile Header */}
        <div className="md:hidden fixed top-0 left-0 right-0 z-20 bg-slate-900 border-b border-slate-800 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-emerald-500 p-1.5 rounded-lg">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              Lyrathon
            </span>
          </div>
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white hover:bg-slate-800">
                <Menu className="w-6 h-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0 bg-slate-900 border-r border-slate-800 text-white">
              <div className="hidden">
                <SheetTitle>Navigation Menu</SheetTitle>
                <SheetDescription>Main navigation for Lyrathon company dashboard</SheetDescription>
              </div>
              <div className="p-6 border-b border-slate-800 flex items-center gap-2">
                <div className="bg-emerald-500 p-2 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                  Lyrathon Hiring
                </span>
              </div>

              <nav className="flex-1 p-4 space-y-2">
                {sidebarItems.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link key={item.href} href={item.href} onClick={() => setIsOpen(false)}>
                      <div
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isActive
                          ? "bg-emerald-600 text-white"
                          : "text-slate-400 hover:bg-slate-800 hover:text-white"
                          }`}
                      >
                        <Icon className={`w-5 h-5 ${isActive ? "text-white" : "text-slate-400"}`} />
                        {item.title}
                      </div>
                    </Link>
                  );
                })}
              </nav>

              <div className="p-4 border-t border-slate-800 mt-auto">
                <Link href="/">
                  <Button variant="ghost" className="w-full justify-start text-slate-400 hover:text-red-400 hover:bg-red-950/30">
                    <LogOut className="w-5 h-5 mr-3" />
                    Sign Out
                  </Button>
                </Link>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Sidebar */}
        <aside className="w-64 bg-slate-900 border-r border-slate-800 hidden md:flex flex-col fixed h-full z-10 text-white">
          <div className="p-6 border-b border-slate-800 flex items-center gap-2">
            <div className="bg-emerald-500 p-2 rounded-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              Lyrathon Hiring
            </span>
          </div>

          <nav className="flex-1 p-4 space-y-2">
            {sidebarItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href}>
                  <div
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isActive
                      ? "bg-emerald-600 text-white"
                      : "text-slate-400 hover:bg-slate-800 hover:text-white"
                      }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? "text-white" : "text-slate-400"}`} />
                    {item.title}
                  </div>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-slate-800">
            <Link href="/">
              <Button variant="ghost" className="w-full justify-start text-slate-400 hover:text-red-400 hover:bg-red-950/30">
                <LogOut className="w-5 h-5 mr-3" />
                Sign Out
              </Button>
            </Link>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 md:ml-64 p-8 min-h-screen pt-20 md:pt-8">
          {children}
        </main>
      </div>
    </CompanyProvider>
  );
}

