"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { ShoppingBag, Heart, User } from "lucide-react";

export default function DashboardPage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div className="min-h-[60vh] flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-[70vh] flex flex-col items-center text-center px-4 animate-[fade-in-up_0.8s_ease-out_forwards]">
      <h1 className="text-6xl md:text-5xl text-indigo-600 dark:text-indigo-400 font-pacifico tracking-wide mb-10 drop-shadow-sm">
        Shoppy
      </h1>
      
      <h2 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
        Hi, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600">{session?.user?.name || 'Guest'}</span>!
      </h2>
      
      <p className="text-lg text-slate-500 dark:text-slate-400 mb-12 max-w-2xl mx-auto">
        This is your central hub for managing your shopping experience. Track your orders, review your wishlist, and update your personal details all in one place.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-4xl">
        <Link href="/dashboard/orders" className="group flex flex-col items-center justify-center p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="w-16 h-16 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
            <ShoppingBag size={32} />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">My Orders</h3>
          <p className="text-sm text-slate-500 text-center">Track & view history</p>
        </Link>

        <Link href="/dashboard/wishlist" className="group flex flex-col items-center justify-center p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-900/20 text-rose-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
            <Heart size={32} />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Wishlist</h3>
          <p className="text-sm text-slate-500 text-center">Saved items</p>
        </Link>

        <Link href="/dashboard/profile" className="group flex flex-col items-center justify-center p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
            <User size={32} />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Profile</h3>
          <p className="text-sm text-slate-500 text-center">Manage details</p>
        </Link>
      </div>
    </div>
  );
}
