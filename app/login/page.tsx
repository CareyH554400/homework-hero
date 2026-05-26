"use client";
import { useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPage() {
  const supabase = getSupabaseBrowser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [err, setErr] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setNotice(null); setLoading(true);
    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) { setErr(error.message); return; }
      router.push(nextPath); router.refresh();
    } else {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${origin}/auth/callback` },
      });
      setLoading(false);
      if (error) { setErr(error.message); return; }
      // If confirmation is required, there's no session yet
      if (!data.session) {
        setNotice(`We sent a confirmation link to ${email}. Open it to finish signing up.`);
      } else {
        router.push(nextPath); router.refresh();
      }
    }
  }

  async function resend() {
    setErr(null); setNotice(null);
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: `${origin}/auth/callback` },
    });
    if (error) setErr(error.message);
    else setNotice(`New confirmation link sent to ${email}.`);
  }

  return (
    <div className="max-w-sm mx-auto mt-16">
      <h1 className="text-3xl font-bold text-blue-600 mb-2">📚 Homework Tracker</h1>
      <p className="text-slate-600 mb-6">{mode === "signin" ? "Sign in to your account" : "Create a new account"}</p>
      <form onSubmit={submit} className="space-y-3">
        <input type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-slate-300 rounded-md px-3 py-2" />
        <input type="password" required placeholder="Password (min 6 chars)" value={password} onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-slate-300 rounded-md px-3 py-2" />
        {err && <div className="text-red-600 text-sm">{err}</div>}
        {notice && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-md p-3">
            ✅ {notice}
            <button type="button" onClick={resend} className="block mt-2 text-xs text-emerald-700 underline">
              Resend confirmation email
            </button>
          </div>
        )}
        <button disabled={loading} className="w-full bg-blue-600 text-white rounded-md py-2 font-medium disabled:opacity-50">
          {loading ? "..." : mode === "signin" ? "Sign in" : "Sign up"}
        </button>
      </form>
      <button onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setErr(null); setNotice(null); }} className="text-sm text-blue-600 mt-4">
        {mode === "signin" ? "Need an account? Sign up" : "Have an account? Sign in"}
      </button>
    </div>
  );
}
