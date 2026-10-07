"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, UserPlus, LogIn, Eye, EyeOff, CheckCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    if (isLogin) {
      const res = await signIn("credentials", {
        username,
        password,
        redirect: false,
      });

      if (res?.ok) {
        if (username === "admin") {
          router.push("/admin");
        } else {
          router.push("/terminal");
        }
      } else {
        setError("Invalid credentials.");
        setIsLoading(false);
      }
    } else {
      try {
        const res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        });
        
        const data = await res.json();
        
        if (res.ok) {
          setSuccess("Account created successfully! Logging you in...");
          // Auto login after signup
          const signinRes = await signIn("credentials", {
            username,
            password,
            redirect: false,
          });
          if (signinRes?.ok) {
            router.push("/terminal");
          } else {
            setError("Signup successful, but login failed.");
            setIsLoading(false);
          }
        } else {
          setError(data.error || "Signup failed.");
          setIsLoading(false);
        }
      } catch (err) {
        setError("Network error occurred.");
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] text-[var(--foreground)] px-4">
      <div className="w-full max-w-md p-6 sm:p-8 dashboard-panel border border-[var(--border-color)]">
        
        <div className="flex flex-col items-center mb-10">
          <div className="w-12 h-12 bg-zinc-900 rounded-xl flex items-center justify-center border border-[var(--border-color)] mb-4">
            <Shield className="text-zinc-300 w-6 h-6" />
          </div>
          <h1 className="text-2xl font-semibold text-[var(--foreground)] tracking-tight">
            {isLogin ? "Sign in to TLOS" : "Register for TLOS"}
          </h1>
          <p className="text-sm text-zinc-500 mt-2">
            {isLogin ? "Access your team dashboard" : "Create a new team account"}
          </p>
        </div>
        
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-lg mb-6 text-sm text-center flex items-center justify-center gap-2">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/50 text-emerald-500 p-3 rounded-lg mb-6 text-sm text-center flex items-center justify-center gap-2">
            <CheckCircle size={16} /> {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-zinc-400 block mb-2">Team Name (Username)</label>
              <input 
                type="text"
                value={username} 
                onChange={e => setUsername(e.target.value)}
                placeholder="Enter your team name"
                required
                className="w-full bg-[var(--background)] border border-[var(--border-color)] rounded-lg p-3 text-zinc-200 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
            <div className="relative">
              <label className="text-sm font-medium text-zinc-400 block mb-2">Password</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"}
                  value={password} 
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full bg-[var(--background)] border border-[var(--border-color)] rounded-lg p-3 text-zinc-200 focus:outline-none focus:border-emerald-500 transition-colors pr-10"
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </div>
          
          <button 
            type="submit"
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 rounded-lg transition-colors flex justify-center items-center gap-2"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : isLogin ? (
              <><LogIn className="w-5 h-5" /> Access Terminal</>
            ) : (
              <><UserPlus className="w-5 h-5" /> Register Team</>
            )}
          </button>
        </form>
        
        <div className="mt-8 text-center">
          <button 
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError("");
              setSuccess("");
            }}
            className="text-sm text-zinc-400 hover:text-emerald-400 transition-colors"
          >
            {isLogin ? "Don't have a team yet? Sign up here." : "Already registered? Sign in."}
          </button>
        </div>
      </div>
    </div>
  );
}
