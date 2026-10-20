"use client";
import { useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const supabase = getSupabaseBrowser();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "https://myhomeworktracker.com/auth/reset",
    });
    setLoading(false);
    if (error) { setErr(error.message); return; }
    setSent(true);
  }

  return (
    <div className="max-w-sm mx-auto mt-16">
      <h1 className="text-3xl font-bold text-blue-600 mb-2">📚 Homework Tracker</h1>
      <p className="text-slate-600 mb-6">Reset your password</p>

      {sent ? (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-md p-4">
          ✅ Check your email — we sent a password reset link to <strong>{email}</strong>.
          <div className="mt-3">
            <a href="/login" className="text-blue-600 underline text-sm">Back to sign in</a>
          </div>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-3">
          <input
            type="email"
            required
            placeholder="Your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-slate-300 rounded-md px-3 py-2"
          />
          {err && <div className="text-red-600 text-sm">{err}</div>}
          <button
            disabled={loading}
            className="w-full bg-blue-600 text-white rounded-md py-2 font-medium disabled:opacity-50"
          >
            {loading ? "Sending..." : "Send reset link"}
          </button>
          <div className="text-center">
            <a href="/login" className="text-sm text-blue-600 hover:underline">Back to sign in</a>
          </div>
        </form>
      )}
    </div>
  );
}
