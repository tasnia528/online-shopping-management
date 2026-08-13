"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Suspense, useEffect } from "react";

function VerifyForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const urlEmail = searchParams.get("email");
    if (urlEmail) {
      setEmail(urlEmail);
    }
  }, [searchParams]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage("Email verified successfully! Logging you in...");
        
        // Auto-login logic
        const tempPassword = sessionStorage.getItem("temp_password");
        if (tempPassword) {
          const { signIn } = await import("next-auth/react");
          const signInRes = await signIn("credentials", {
            redirect: false,
            email,
            password: tempPassword,
          });
          
          sessionStorage.removeItem("temp_password"); // clear it immediately
          
          if (!signInRes?.error) {
            router.push("/");
            return;
          }
        }
        
        // Fallback to signin if auto-login fails
        setTimeout(() => router.push("/signin"), 2000);
      } else {
        setError(data.message || "Verification failed");
      }
    } catch (err) {
      setError("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      setError("Please enter your email to resend code.");
      return;
    }
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const res = await fetch("/api/auth/resend-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage("Verification code sent to your email.");
      } else {
        setError(data.message || "Failed to resend code");
      }
    } catch (err) {
      setError("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-black py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-slate-900 p-10 shadow-2xl rounded-xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Verify Account</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Enter the 6-digit code sent to your email.</p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleVerify}>
          <div className="space-y-4">
            <div className="text-center mb-4">
              <p className="text-sm text-slate-500 font-medium">Verifying email: <span className="text-slate-900 dark:text-white">{email || "..."}</span></p>
            </div>
            <div>
              <label htmlFor="code" className="sr-only">Verification Code</label>
              <input id="code" name="code" type="text" required value={code} onChange={(e) => setCode(e.target.value)} className="appearance-none relative block w-full px-3 py-3 border border-slate-300 dark:border-slate-700 placeholder-slate-500 text-slate-900 dark:text-white dark:bg-slate-800 rounded focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-center tracking-[0.5em] font-bold text-xl" placeholder="XXXXXX" maxLength={6} />
            </div>
          </div>

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          {message && <p className="text-green-500 text-sm text-center font-bold">{message}</p>}

          <div>
            <button type="submit" disabled={loading} className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50">
              {loading ? "Verifying..." : "Verify Account"}
            </button>
          </div>
          <div className="text-center">
            <button type="button" onClick={handleResend} disabled={loading} className="text-sm text-indigo-600 hover:text-indigo-500 font-medium bg-transparent border-none cursor-pointer">
              Didn't receive a code? Resend
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <VerifyForm />
    </Suspense>
  );
}
