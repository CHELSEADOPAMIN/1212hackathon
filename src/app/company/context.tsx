"use client";

import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

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

// 公司信息类型
export interface CompanyData {
  _id?: string;
  email: string;
  name: string;
  industry?: string;
  description?: string;
  website?: string;
  location?: string;
}

interface CompanyContextType {
  companyData: CompanyData | null;
  setCompanyData: (data: CompanyData | null) => void;
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
const INITIAL_INTERVIEWS: Candidate[] = [];

const INITIAL_OFFERS: Candidate[] = [];

export function CompanyProvider({ children }: { children: ReactNode }) {
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);
  const [interested, setInterested] = useState<Candidate[]>([]);
  const [interviews, setInterviews] = useState<Candidate[]>(INITIAL_INTERVIEWS);
  const [offers, setOffers] = useState<Candidate[]>(INITIAL_OFFERS);

  // 初始化时尝试从 localStorage 加载公司信息
  useEffect(() => {
    const saved = localStorage.getItem('companyProfile');
    if (saved) {
      try {
        setCompanyData(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse company profile", e);
      }
    }
  }, []);

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
      companyData,
      setCompanyData,
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
