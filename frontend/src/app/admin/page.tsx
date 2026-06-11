"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { 
  LayoutDashboard, Users, FileText, Activity, 
  ChevronDown, ChevronUp, Check, Minus, BarChart3 
} from "lucide-react";

// Read admin UIDs from environment
const ADMIN_UIDS = (process.env.NEXT_PUBLIC_ADMIN_UIDS || "").split(",").map(uid => uid.trim());

export default function AdminDashboard() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);

  const [scans, setScans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  
  const [displayLimit, setDisplayLimit] = useState(50);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user && ADMIN_UIDS.includes(user.uid)) {
        setIsAuthorized(true);
      } else {
        router.replace("/");
      }
      setAuthChecking(false);
    });

    return () => unsubscribeAuth();
  }, [router]);

  useEffect(() => {
    if (!isAuthorized) return;

    const q = query(collection(db, "resume_scans"), orderBy("timestamp", "desc"));
    const unsubscribeData = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setScans(data);
      setLastUpdated(new Date());
      setLoading(false);
    }, (error) => {
      console.error("Error fetching scans:", error);
      setLoading(false);
    });

    return () => unsubscribeData();
  }, [isAuthorized]);

  const [timeAgo, setTimeAgo] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeAgo(Math.floor((new Date().getTime() - lastUpdated.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [lastUpdated]);

  const stats = useMemo(() => {
    const total = scans.length;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let todayCount = 0;
    let pdfCount = 0;
    let totalScore = 0;
    const users = new Set();
    const sessions = new Set();
    const scoreBuckets = [0, 0, 0, 0, 0]; // 0-20, 21-40, 41-60, 61-80, 81-100
    const daysMap: Record<string, number> = {};
    const skillsMap: Record<string, number> = {};

    // Initialize last 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      daysMap[d.toISOString().split("T")[0]] = 0;
    }

    scans.forEach(scan => {
      const ts = new Date(scan.timestamp);
      if (ts >= today) todayCount++;
      if (scan.pdf_generated) pdfCount++;
      if (scan.user_uid) users.add(scan.user_uid);
      if (!scan.user_uid && scan.session_id) sessions.add(scan.session_id);
      
      const score = scan.score || 0;
      totalScore += score;
      
      if (score <= 20) scoreBuckets[0]++;
      else if (score <= 40) scoreBuckets[1]++;
      else if (score <= 60) scoreBuckets[2]++;
      else if (score <= 80) scoreBuckets[3]++;
      else scoreBuckets[4]++;

      const dateStr = ts.toISOString().split("T")[0];
      if (daysMap[dateStr] !== undefined) {
        daysMap[dateStr]++;
      }

      const skills = scan.resume_data?.skills_found || [];
      skills.forEach((skill: string) => {
        skillsMap[skill] = (skillsMap[skill] || 0) + 1;
      });
    });

    const topSkills = Object.entries(skillsMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    return {
      total,
      todayCount,
      pdfCount,
      convRate: total ? Math.round((pdfCount / total) * 100) : 0,
      activeUsers: users.size,
      anonSessions: sessions.size,
      avgScore: total ? Math.round(totalScore / total) : 0,
      scoreBuckets,
      dailyScans: Object.entries(daysMap).map(([date, count]) => ({ date, count })),
      topSkills,
    };
  }, [scans]);

  const toggleRow = (id: string) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  if (authChecking) {
    return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400">Verifying access...</div>;
  }

  if (!isAuthorized) return null;

  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-300 font-sans flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col hidden md:flex fixed h-full">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-xl font-bold text-[#1D9E75] tracking-tight">myatsscore.app</h1>
          <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-semibold">Admin Panel</p>
        </div>
        <nav className="p-4 flex-1">
          <div className="flex items-center gap-3 px-4 py-3 bg-[#1D9E75]/10 text-[#1D9E75] rounded-lg font-medium">
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-8 overflow-y-auto min-h-screen">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-white tracking-tight">Overview</h2>
            <p className="text-sm text-slate-500 mt-1">Real-time scan metrics & activity</p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-slate-400">Last updated: {timeAgo}s ago</span>
          </div>
        </header>

        {loading ? (
          <div className="space-y-8 max-w-7xl mx-auto animate-pulse">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-slate-900 rounded-xl p-6 border border-slate-800 h-32">
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-4 bg-slate-800 rounded w-24"></div>
                    <div className="w-8 h-8 bg-slate-800 rounded-lg"></div>
                  </div>
                  <div className="h-8 bg-slate-800 rounded w-16 mb-2"></div>
                  <div className="h-3 bg-slate-800 rounded w-20"></div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-slate-900 rounded-xl p-6 border border-slate-800 h-64">
                  <div className="h-5 bg-slate-800 rounded w-1/3 mb-6"></div>
                  <div className="w-full h-40 bg-slate-800 rounded"></div>
                </div>
              ))}
            </div>
            <div className="bg-slate-900 rounded-xl border border-slate-800 h-96">
               <div className="p-6 border-b border-slate-800"><div className="h-5 bg-slate-800 rounded w-32"></div></div>
               <div className="p-6 space-y-4">
                 {[...Array(5)].map((_, i) => (
                   <div key={i} className="h-8 bg-slate-800 rounded w-full"></div>
                 ))}
               </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8 max-w-7xl mx-auto">
            
            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-900 rounded-xl p-6 border border-slate-800 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-slate-400 text-sm font-medium">Total Scans</h3>
                  <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg"><Activity className="w-4 h-4" /></div>
                </div>
                <p className="text-3xl font-bold text-white">{stats.total.toLocaleString()}</p>
                <p className="text-sm text-emerald-400 mt-2 font-medium">+{stats.todayCount} today</p>
              </div>

              <div className="bg-slate-900 rounded-xl p-6 border border-slate-800 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-slate-400 text-sm font-medium">PDFs Generated</h3>
                  <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg"><FileText className="w-4 h-4" /></div>
                </div>
                <p className="text-3xl font-bold text-white">{stats.pdfCount.toLocaleString()}</p>
                <p className="text-sm text-slate-500 mt-2 font-medium">{stats.convRate}% conversion rate</p>
              </div>

              <div className="bg-slate-900 rounded-xl p-6 border border-slate-800 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-slate-400 text-sm font-medium">Active Users</h3>
                  <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg"><Users className="w-4 h-4" /></div>
                </div>
                <p className="text-3xl font-bold text-white">{stats.activeUsers.toLocaleString()}</p>
                <p className="text-sm text-slate-500 mt-2 font-medium">{stats.anonSessions.toLocaleString()} anonymous sessions</p>
              </div>

              <div className="bg-slate-900 rounded-xl p-6 border border-slate-800 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-slate-400 text-sm font-medium">Avg ATS Score</h3>
                  <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg"><BarChart3 className="w-4 h-4" /></div>
                </div>
                <p className="text-3xl font-bold text-white">{stats.avgScore}</p>
                <p className="text-sm text-slate-500 mt-2 font-medium">across all scans</p>
              </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Daily Scans */}
              <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
                <h3 className="text-slate-100 font-semibold mb-6">Daily Scans (Last 7 Days)</h3>
                <div className="flex items-end gap-2 h-48">
                  {stats.dailyScans.map((day, i) => {
                    const max = Math.max(...stats.dailyScans.map(d => d.count), 1);
                    const height = `${(day.count / max) * 100}%`;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-2">
                        <div className="w-full bg-slate-800 rounded-t-sm flex items-end justify-center relative group h-full">
                          <div 
                            className="w-full bg-[#1D9E75] rounded-t-sm transition-all duration-500" 
                            style={{ height }}
                          ></div>
                          <div className="opacity-0 group-hover:opacity-100 absolute -top-8 bg-slate-700 text-white text-xs py-1 px-2 rounded">
                            {day.count}
                          </div>
                        </div>
                        <span className="text-[10px] text-slate-500 rotate-45 origin-left mt-2">
                          {day.date.slice(5)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Score Distribution */}
              <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
                <h3 className="text-slate-100 font-semibold mb-6">Score Distribution</h3>
                <div className="flex items-end gap-2 h-48 pb-6">
                  {stats.scoreBuckets.map((count, i) => {
                    const labels = ["0-20", "21-40", "41-60", "61-80", "81-100"];
                    const colors = ["bg-red-500", "bg-orange-500", "bg-amber-500", "bg-blue-500", "bg-[#1D9E75]"];
                    const max = Math.max(...stats.scoreBuckets, 1);
                    const height = `${(count / max) * 100}%`;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full">
                        <div className="w-full flex items-end justify-center relative group h-full">
                          <div 
                            className={`w-full ${colors[i]} opacity-80 rounded-t-sm transition-all duration-500`} 
                            style={{ height }}
                          ></div>
                          <div className="opacity-0 group-hover:opacity-100 absolute -top-8 bg-slate-700 text-white text-xs py-1 px-2 rounded pointer-events-none z-10">
                            {count}
                          </div>
                        </div>
                        <span className="text-xs text-slate-400 font-medium">{labels[i]}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Top Skills */}
              <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
                <h3 className="text-slate-100 font-semibold mb-4">Top Skills Found</h3>
                <div className="space-y-3">
                  {stats.topSkills.map(([skill, count], i) => {
                    const max = stats.topSkills[0]?.[1] || 1;
                    const width = `${(count / max) * 100}%`;
                    return (
                      <div key={i} className="relative">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-300 font-medium truncate pr-2">{skill}</span>
                          <span className="text-slate-500">{count}</span>
                        </div>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-[#1D9E75] h-full rounded-full opacity-80" style={{ width }}></div>
                        </div>
                      </div>
                    );
                  })}
                  {stats.topSkills.length === 0 && (
                    <div className="text-slate-500 text-sm text-center py-10">No skills data yet</div>
                  )}
                </div>
              </div>

            </div>

            {/* Table */}
            <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
              <div className="p-6 border-b border-slate-800">
                <h3 className="text-slate-100 font-semibold">Recent Scans</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-slate-800/50 text-slate-400">
                    <tr>
                      <th className="px-6 py-3 font-medium">Time</th>
                      <th className="px-6 py-3 font-medium">Name</th>
                      <th className="px-6 py-3 font-medium">Email</th>
                      <th className="px-6 py-3 font-medium text-center">Score</th>
                      <th className="px-6 py-3 font-medium text-center">Mode</th>
                      <th className="px-6 py-3 font-medium text-center">PDF</th>
                      <th className="px-6 py-3 font-medium text-center">Auto-Fix</th>
                      <th className="px-6 py-3 font-medium">Session</th>
                      <th className="px-6 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {scans.slice(0, displayLimit).map((scan) => {
                      const expanded = expandedRows[scan.id];
                      return (
                        <React.Fragment key={scan.id}>
                          <tr className="hover:bg-slate-800/30 transition-colors cursor-pointer group" onClick={() => toggleRow(scan.id)}>
                            <td className="px-6 py-4 text-slate-400">
                              {new Date(scan.timestamp).toLocaleTimeString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className="px-6 py-4 font-medium text-slate-200">
                              {scan.resume_data?.name || "Unknown"}
                            </td>
                            <td className="px-6 py-4 text-slate-400">
                              {scan.resume_data?.email || "—"}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                scan.score >= 80 ? "bg-emerald-500/10 text-emerald-400" :
                                scan.score >= 60 ? "bg-blue-500/10 text-blue-400" :
                                scan.score >= 40 ? "bg-amber-500/10 text-amber-400" :
                                "bg-red-500/10 text-red-400"
                              }`}>
                                {scan.score || 0} {scan.grade}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center text-slate-400 uppercase text-xs font-medium">
                              {scan.mode || "GENERAL"}
                            </td>
                            <td className="px-6 py-4 text-center">
                              {scan.pdf_generated ? <Check className="w-4 h-4 text-emerald-500 mx-auto" /> : <Minus className="w-4 h-4 text-slate-600 mx-auto" />}
                            </td>
                            <td className="px-6 py-4 text-center">
                              {scan.auto_fix_used ? <Check className="w-4 h-4 text-blue-500 mx-auto" /> : <Minus className="w-4 h-4 text-slate-600 mx-auto" />}
                            </td>
                            <td className="px-6 py-4 text-slate-500 font-mono text-xs">
                              {scan.session_id ? scan.session_id.substring(0, 8) : "—"}
                            </td>
                            <td className="px-6 py-4 text-right text-slate-500 group-hover:text-slate-300">
                              {expanded ? <ChevronUp className="w-4 h-4 inline" /> : <ChevronDown className="w-4 h-4 inline" />}
                            </td>
                          </tr>
                          {expanded && (
                            <tr className="bg-slate-800/20 border-b border-slate-800">
                              <td colSpan={9} className="px-6 py-6">
                                <div className="grid grid-cols-2 gap-8 text-sm">
                                  <div>
                                    <h4 className="text-slate-400 font-semibold mb-3">Score Breakdown</h4>
                                    <div className="space-y-2 max-w-sm">
                                      {Object.entries(scan.score_breakdown || {}).map(([key, val]: any) => (
                                        <div key={key} className="flex justify-between text-slate-300">
                                          <span className="capitalize">{key}</span>
                                          <span className="font-medium">{val}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                  <div>
                                    <h4 className="text-slate-400 font-semibold mb-3">Extracted Skills ({scan.resume_data?.skills_found?.length || 0})</h4>
                                    <div className="flex flex-wrap gap-2">
                                      {scan.resume_data?.skills_found?.slice(0, 20).map((s: string, i: number) => (
                                        <span key={i} className="px-2 py-1 bg-slate-800 text-slate-300 rounded text-xs border border-slate-700">
                                          {s}
                                        </span>
                                      ))}
                                      {(scan.resume_data?.skills_found?.length || 0) > 20 && (
                                        <span className="px-2 py-1 bg-slate-800 text-slate-500 rounded text-xs">
                                          +{(scan.resume_data.skills_found.length - 20)} more
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                    {scans.length === 0 && (
                      <tr>
                        <td colSpan={9} className="px-6 py-8 text-center text-slate-500">
                          No scans found in the database yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              
              {scans.length > displayLimit && (
                <div className="p-4 border-t border-slate-800 flex justify-center bg-slate-800/30">
                  <button 
                    onClick={() => setDisplayLimit(p => p + 50)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-colors"
                  >
                    Load 50 more (Showing {displayLimit} of {scans.length})
                  </button>
                </div>
              )}
            </div>

          </div>
        )}
      </main>
    </div>
  );
}
