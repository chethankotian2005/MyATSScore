"use client";

import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { getUserScans } from '@/lib/firestore';
import { LogOut, Settings, Clock, FileText, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';


export default function DashboardPage() {
  const { user, signOut, loading: authLoading } = useAuth();
  const { isPro, isLoading: subLoading } = useSubscription();

  const [history, setHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      getUserScans(user.uid)
        .then(data => setHistory(data))
        .catch(console.error)
        .finally(() => setHistoryLoading(false));
    }
  }, [user]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1D9E75]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="font-bold text-xl tracking-tight text-[#1D9E75]">
            myatsscore.app
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/analyze" className="text-sm font-medium text-slate-700 hover:text-[#1D9E75]">New Scan</Link>
            <button onClick={signOut} className="text-sm text-slate-500 hover:text-slate-800 flex items-center gap-1">
              <LogOut className="w-4 h-4" /> Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Welcome back{user.email ? `, ${user.email.split('@')[0]}` : ''}</h1>
          <p className="text-slate-500 text-sm">Manage your account and view your scan history.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#1D9E75]" /> Usage limit
              </h2>
              
                <div>
                  <div className="text-2xl font-bold text-slate-900 mb-1">Unlimited</div>
                  <p className="text-sm text-slate-500 mb-4">You have unlimited scans.</p>
                  <div className="w-full bg-[#1D9E75] rounded-full h-2"></div>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Settings className="w-4 h-4 text-slate-500" /> Account Settings
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Email</label>
                  <div className="text-sm font-medium text-slate-900">{user.email}</div>
                </div>
                <div className="pt-4 border-t border-slate-100">
                  <button className="text-sm text-red-600 hover:text-red-700 font-medium">Delete Account</button>
                </div>
              </div>
            </div>
          </div>

          <div className="md:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#1D9E75]" /> Scan History
                </h2>
              </div>
              
              {historyLoading ? (
                <div className="p-6 space-y-4">
                  <div className="animate-pulse bg-slate-100 h-16 w-full rounded-xl"></div>
                  <div className="animate-pulse bg-slate-100 h-16 w-full rounded-xl"></div>
                </div>
              ) : history.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {history.map((item) => (
                    <Link href={`/analyze/${item.id}`} key={item.id} className="flex items-center justify-between p-6 hover:bg-slate-50 transition-colors group">
                      <div>
                        <div className="font-bold text-slate-900">{item.jobTitle || 'Custom Analysis'}</div>
                        <div className="text-sm text-slate-500 mt-1">{item.resumeFilename} • {new Date(item.createdAt?.toMillis ? item.createdAt.toMillis() : Date.now()).toLocaleDateString()}</div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <div className={`text-xl font-extrabold ${item.score >= 70 ? 'text-green-500' : item.score >= 50 ? 'text-amber-500' : 'text-red-500'}`}>
                            {item.score}
                          </div>
                          <div className="text-xs font-bold text-slate-400">Grade {item.grade}</div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-[#1D9E75] transition-colors" />
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-8 h-8 text-slate-300" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-900">No scans yet</h3>
                  <p className="text-slate-500 mt-1 mb-6">Upload your first resume to get started.</p>
                  <Link href="/analyze" className="inline-flex items-center justify-center bg-[#1D9E75] text-white px-6 py-2 rounded-lg font-medium hover:bg-[#157e5d]">
                    New Scan
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>


    </div>
  );
}
