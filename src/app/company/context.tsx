"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

// 定义数据类型
export interface Candidate {
  id: string;
  name: string;
  role: string;
  skills: { subject: string; A: number }[];
  summary: string;
  avatar: string;
  // Interview Stage Data
  interviewScore?: number;
  interviewFeedback?: string;
  // Offer Stage Data
  marketOffer?: number;
  yourOffer?: number;
}

interface CompanyContextType {
  interested: Candidate[];
  interviews: Candidate[];
  offers: Candidate[];
  addToInterested: (candidate: Candidate) => void;
  moveToInterview: (id: string) => void;
  moveToOffer: (id: string) => void;
  updateOffer: (id: string, newOffer: number) => void;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

// 初始 Mock 数据
const INITIAL_INTERVIEWS: Candidate[] = [
  {
    id: "demo-interview-1",
    name: "Sarah Jenkins",
    role: "Senior Frontend Engineer",
    avatar: "https://github.com/shadcn.png",
    skills: [
      { subject: 'React', A: 95 },
      { subject: 'Design', A: 88 },
      { subject: 'Node', A: 70 },
    ],
    summary: "Expert in building scalable UI systems. Contributor to major open source libraries.",
    interviewScore: 92,
    interviewFeedback: "Candidate showed strong leadership potential and deep understanding of React internals."
  }
];

const INITIAL_OFFERS: Candidate[] = [
  {
    id: "demo-offer-1",
    name: "Alex Chen",
    role: "Full Stack Developer",
    avatar: "https://github.com/shadcn.png",
    skills: [
      { subject: 'System', A: 90 },
      { subject: 'Coding', A: 95 },
      { subject: 'Prod', A: 85 },
    ],
    summary: "High performance individual with strong system design skills.",
    marketOffer: 185000,
    yourOffer: 170000
  }
];

export function CompanyProvider({ children }: { children: ReactNode }) {
  const [interested, setInterested] = useState<Candidate[]>([]);
  const [interviews, setInterviews] = useState<Candidate[]>(INITIAL_INTERVIEWS);
  const [offers, setOffers] = useState<Candidate[]>(INITIAL_OFFERS);

  const addToInterested = (candidate: Candidate) => {
    setInterested(prev => [...prev, candidate]);
  };

  const moveToInterview = (id: string) => {
    const candidate = interested.find(c => c.id === id);
    if (candidate) {
      setInterested(prev => prev.filter(c => c.id !== id));
      // 模拟添加面试数据
      setInterviews(prev => [...prev, {
        ...candidate,
        interviewScore: 0, // 初始分
        interviewFeedback: "Waiting for AI Interview..."
      }]);
    }
  };

  const moveToOffer = (id: string) => {
    const candidate = interviews.find(c => c.id === id);
    if (candidate) {
      setInterviews(prev => prev.filter(c => c.id !== id));
      // 模拟初始报价
      setOffers(prev => [...prev, {
        ...candidate,
        marketOffer: 180000,
        yourOffer: 165000
      }]);
    }
  };

  const updateOffer = (id: string, newOffer: number) => {
    setOffers(prev => prev.map(c => 
      c.id === id ? { ...c, yourOffer: newOffer } : c
    ));
  };

  return (
    <CompanyContext.Provider value={{
      interested,
      interviews,
      offers,
      addToInterested,
      moveToInterview,
      moveToOffer,
      updateOffer
    }}>
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  const context = useContext(CompanyContext);
  if (context === undefined) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }
  return context;
}

