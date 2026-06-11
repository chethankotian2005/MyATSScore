"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { LogOut, User as UserIcon } from "lucide-react";

export function UserNav() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div className="w-16 h-8 animate-pulse bg-slate-100 rounded-md"></div>;
  }

  if (!user) {
    return (
      <Link href="/auth" className="text-sm text-slate-600 hover:text-slate-900 font-medium">
        Log In
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-4 relative group">
      <div className="flex items-center gap-2 cursor-pointer">
        {user.photoURL ? (
          <img src={user.photoURL} alt="Profile" className="w-8 h-8 rounded-full border border-slate-200" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-[#1D9E75]/10 flex items-center justify-center text-[#1D9E75] border border-[#1D9E75]/20">
            <UserIcon className="w-4 h-4" />
          </div>
        )}
      </div>

      {/* Dropdown on hover */}
      <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
        <div className="px-4 py-3 border-b border-slate-100">
          <p className="text-sm font-medium text-slate-900 truncate">{user.displayName || 'User'}</p>
          <p className="text-xs text-slate-500 truncate">{user.email}</p>
        </div>
        <div className="py-1">
          <button
            onClick={() => signOut(auth)}
            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-slate-50 flex items-center gap-2 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
