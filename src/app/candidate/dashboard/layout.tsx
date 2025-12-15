"use client";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ClipboardList, Compass, LogOut, Menu, Radar, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const sidebarItems = [
  {
    title: "My Profile",
    href: "/candidate/dashboard",
    icon: User,
  },
  {
    title: "Opportunities",
    href: "/candidate/dashboard/opportunities",
    icon: Compass,
  },
  {
    title: "Applications",
    href: "/candidate/dashboard/applications",
    icon: ClipboardList,
  },
];

export default function CandidateDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-20 bg-white border-b border-slate-200 p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-1.5 rounded-lg">
            <Radar className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            GeekHunter
          </span>
        </div>
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="w-6 h-6 text-slate-600" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <div className="hidden">
              <SheetTitle>Navigation Menu</SheetTitle>
              <SheetDescription>Main navigation for GeekHunter candidate dashboard</SheetDescription>
            </div>
            <div className="p-6 border-b border-slate-100 flex items-center gap-2">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Radar className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                GeekHunter
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
                        ? "bg-blue-50 text-blue-700"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        }`}
                    >
                      <Icon className={`w-5 h-5 ${isActive ? "text-blue-600" : "text-slate-400"}`} />
                      {item.title}
                    </div>
                  </Link>
                );
              })}
            </nav>

            <div className="p-4 border-t border-slate-100 mt-auto">
              <Link href="/">
                <Button variant="ghost" className="w-full justify-start text-slate-500 hover:text-red-600 hover:bg-red-50">
                  <LogOut className="w-5 h-5 mr-3" />
                  Sign Out
                </Button>
              </Link>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col fixed h-full z-10">
        <div className="p-6 border-b border-slate-100 flex items-center gap-2">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Radar className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            GeekHunter
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
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? "text-blue-600" : "text-slate-400"}`} />
                  {item.title}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <Link href="/">
            <Button variant="ghost" className="w-full justify-start text-slate-500 hover:text-red-600 hover:bg-red-50">
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
  );
}
