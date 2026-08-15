"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignUpPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        sessionStorage.setItem("temp_password", password);
        router.push(`/verify?email=${encodeURIComponent(email)}`);
      } else {
        setError(data.message || "Failed to sign up");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
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
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">Create Account</h1>
            <p className="text-slate-500 dark:text-slate-400">Join us and start shopping in style.</p>
          </div>
          
          <form className="flex flex-col gap-6" onSubmit={handleSignUp}>
            <div>
              <label className="block text-sm font-bold mb-2 text-slate-900 dark:text-white">Full Name</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-none border-b border-slate-300 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white focus:outline-none focus:border-slate-900 dark:focus:border-white transition-colors" 
                placeholder="John Doe" 
                required
              />
            </div>
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
              <label className="block text-sm font-bold mb-2 text-slate-900 dark:text-white">Password</label>
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
            
            {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}

            <button type="submit" disabled={loading} className="w-full mt-4 py-4 bg-slate-900 dark:bg-white text-white dark:text-black font-bold uppercase tracking-wider text-sm hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors">
              {loading ? "Creating..." : "Create Account"}
            </button>
          </form>
          
          <div className="mt-8 text-center sm:text-left text-sm text-slate-500">
            Already have an account? <Link href="/signin" className="text-slate-900 dark:text-white font-bold underline ml-1">Sign in</Link>
          </div>
        </div>
      </div>

      {/* Right Image Side */}
      <div className="hidden lg:block lg:flex-1 relative">
        <Image 
          src="https://images.unsplash.com/photo-1445205170230-053b83016050?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"
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
