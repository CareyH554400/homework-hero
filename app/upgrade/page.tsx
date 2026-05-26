"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function UpgradePage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleUpgrade() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });

      // Not logged in
      if (res.status === 401) {
        router.push("/login?next=/upgrade");
        return;
      }

      // Check we got JSON back (not an HTML redirect page)
      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        router.push("/login?next=/upgrade");
        return;
      }

      const data = await res.json();

      if (data.alreadyPremium) {
        router.push("/upgrade/success");
        return;
      }
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Something went wrong. Please try again.");
        setLoading(false);
      }
    } catch {
      alert("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto py-12 px-4">
      <div className="text-center mb-8">
        <div className="text-4xl mb-3">⭐</div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Upgrade to Premium</h1>
        <p className="text-slate-500">Unlock powerful tools to manage your homework smarter.</p>
      </div>

      <div className="bg-white border-2 border-blue-500 rounded-2xl p-8 shadow-lg mb-6">
        <div className="flex items-baseline gap-1 mb-1">
          <span className="text-4xl font-bold text-slate-900">$3.99</span>
          <span className="text-slate-500">/year</span>
        </div>
        <p className="text-sm text-slate-500 mb-6">Less than $0.34/month. Cancel anytime.</p>

        <ul className="space-y-3 mb-8">
          <li className="flex items-start gap-3">
            <span className="text-green-500 font-bold mt-0.5">✓</span>
            <div>
              <span className="font-semibold text-slate-800">Time Estimation</span>
              <p className="text-sm text-slate-500">Add estimated completion times to Today&apos;s Plan and see your total daily workload at a glance.</p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-green-500 font-bold mt-0.5">✓</span>
            <div>
              <span className="font-semibold text-slate-800">Calendar Feed Import</span>
              <p className="text-sm text-slate-500">Sync assignments automatically from Canvas, Schoology, Google Calendar, or any .ics source.</p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-green-500 font-bold mt-0.5">✓</span>
            <div>
              <span className="font-semibold text-slate-800">Everything in Free</span>
              <p className="text-sm text-slate-500">Manual assignments, Today&apos;s Plan, missing work tracker, and more.</p>
            </div>
          </li>
        </ul>

        <button
          onClick={handleUpgrade}
          disabled={loading}
          className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-lg"
        >
          {loading ? "Redirecting to checkout…" : "Upgrade Now →"}
        </button>

        <p className="text-xs text-center text-slate-400 mt-3">
          Secure payment powered by Stripe
        </p>
      </div>

      <div className="text-center">
        <a href="/" className="text-sm text-slate-500 hover:text-slate-700 underline">
          No thanks, continue with free plan
        </a>
      </div>
    </div>
  );
}
