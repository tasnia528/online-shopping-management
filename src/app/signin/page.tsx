"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      document.cookie = `remember-me=${rememberMe}; path=/; max-age=10`;
      const { signIn } = await import("next-auth/react");
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (res?.error) {
        if (res.error === "unverified") {
          router.push("/verify");
        } else {
          setError(res.error || "Invalid credentials");
        }
      } else {
        router.push("/");
      }
    } catch (err) {
      setError("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex w-full">
      {/* Left Form Side */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-12 lg:px-24 xl:px-32 bg-white dark:bg-black relative">
        <Link href="/" className="absolute top-8 left-8 sm:left-12 flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
          <ArrowLeft size={16} className="mr-2" /> Back to store
        </Link>
        
        <div className="max-w-md w-full mx-auto">
          <div className="mb-10 text-center sm:text-left">
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">Welcome Back</h1>
            <p className="text-slate-500 dark:text-slate-400">Please enter your details to sign in.</p>
          </div>
          
          <form className="flex flex-col gap-6" onSubmit={handleSignIn}>
            <div>
              <label className="block text-sm font-bold mb-2 text-slate-900 dark:text-white">Email Address</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-none border-b border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white focus:outline-none focus:border-slate-900 dark:focus:border-white transition-colors" 
                placeholder="you@example.com" 
                required
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-bold text-slate-900 dark:text-white">Password</label>
              </div>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-none border-b border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white focus:outline-none focus:border-slate-900 dark:focus:border-white transition-colors pr-12" 
                  placeholder="••••••••" 
                  required
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
            
            <div className="flex items-center justify-between mt-2">
              <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer group">
                <div className="relative flex items-center justify-center">
                  <input 
                    type="checkbox" 
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="appearance-none w-5 h-5 border-2 border-slate-300 dark:border-slate-600 rounded bg-transparent checked:bg-slate-900 dark:checked:bg-white checked:border-slate-900 dark:checked:border-white transition-colors focus:outline-none focus:ring-2 focus:ring-slate-900/20 dark:focus:ring-white/20 cursor-pointer" 
                  />
                  {rememberMe && (
                    <svg className="absolute w-3 h-3 text-white dark:text-black pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className="font-medium group-hover:text-slate-900 dark:group-hover:text-white transition-colors">Remember me</span>
              </label>
              
              <Link href="/forgot-password" className="text-sm font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors underline">Forgot password?</Link>
            </div>
            
            {error && <p className="text-red-500 text-sm text-center mt-2">{error}</p>}

            <button disabled={loading} type="submit" className="w-full mt-4 py-4 bg-slate-900 dark:bg-white text-white dark:text-black font-bold uppercase tracking-wider text-sm hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors">
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
          
          <div className="mt-8 text-center sm:text-left text-sm text-slate-500">
            Don't have an account? <Link href="/signup" className="text-slate-900 dark:text-white font-bold underline ml-1">Sign up for free</Link>
          </div>
        </div>
      </div>

      {/* Right Image Side */}
      <div className="hidden lg:block lg:flex-1 relative">
        <Image 
          src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"
          alt="Fashion Model"
          fill
          style={{ objectFit: 'cover' }}
          priority
          unoptimized
        />
        <div className="absolute inset-0 bg-black/20"></div>
      </div>
    </div>
  );
}
