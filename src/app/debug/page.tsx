"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Database, Loader2, RefreshCw, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function DebugPage() {
  const [stats, setStats] = useState<{ jobs: number; candidates: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const fetchStats = async () => {
    setLoading(true);
    try {
      // 临时用一个简单的查数逻辑，这里复用 seed 接口的 GET 方法（我们需要去修改一下 seed 接口支持 GET 查看状态）
      // 或者我们直接在这里调用一个新的 API。为了简单，我们先假设 seed 接口还没改，我们先只做 Seed 按钮。
      // 等下我会去改 API。
      const res = await fetch('/api/debug-stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const res = await fetch('/api/seed', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        toast.success("Success", { description: data.message });
        fetchStats(); // 刷新数据
      } else {
        toast.error("Error", { description: data.error });
      }
    } catch {
      toast.error("Failed to seed data");
    } finally {
      setSeeding(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="container mx-auto p-10 max-w-3xl space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">System Debug</h1>
        <Button variant="outline" onClick={fetchStats} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh Stats
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.jobs ?? '-'}</div>
            <p className="text-xs text-muted-foreground">in MongoDB collection &apos;jobs&apos;</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Candidates</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.candidates ?? '-'}</div>
            <p className="text-xs text-muted-foreground">in MongoDB collection &apos;candidates&apos;</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="text-orange-800">Data Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-orange-700">
            Clicking the button below will <strong>DELETE ALL EXISTING DATA</strong> in jobs/candidates collections and re-insert the mock data with fresh vector embeddings.
          </p>
          <Button
            onClick={handleSeed}
            disabled={seeding}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            {seeding ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
            {seeding ? "Seeding Database..." : "Reset & Seed Mock Data"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

