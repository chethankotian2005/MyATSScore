"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

export function AdminNav() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const adminUids = (process.env.NEXT_PUBLIC_ADMIN_UIDS || "").split(",").map(uid => uid.trim());
    
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && adminUids.includes(user.uid)) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (!isAdmin) return null;

  return (
    <Link href="/admin" className="text-sm text-[#1D9E75] hover:text-[#157e5d] font-bold uppercase tracking-wider">
      Admin
    </Link>
  );
}
