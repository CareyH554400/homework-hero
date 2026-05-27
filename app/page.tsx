import { getSupabaseServer } from "@/lib/supabase/server";
import Link from "next/link";

export default async function HomePage() {
  const supabase = getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  // Logged-in users see their dashboard
  if (user) {
    return <Dashboard userId={user.id} supabase={supabase} />;
  }

  // Logged-out visitors see the marketing landing page
  return <LandingPage />;
}

// ─── Dashboard (logged-in) ────────────────────────────────────────────────────

async function Dashboard({ userId, supabase }: { userId: string; supabase: any }) {
  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowIso = tomorrow.toISOString();

  const { data: dueTodayRaw } = await supabase.from("ht_task").select("*")
    .eq("user_id", userId).eq("status", "open").lte("due_at", tomorrowIso).order("due_at");
  const dueToday = (dueTodayRaw || []).filter((t: any) => t.due_at && t.due_at.slice(0, 10) === today);
  const { data: overdue } = await supabase.from("ht_task").select("*")
    .eq("user_id", userId).eq("status", "open").lt("due_at", today + "T00:00:00Z").order("due_at");
  const { data: planned } = await supabase.from("ht_daily_plan_item").select("*")
    .eq("user_id", userId).eq("plan_date", today);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-1">Hi 👋</h1>
        <p className="text-slate-500">Here&apos;s where things stand right now.</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Due today" value={dueToday.length} color="bg-yellow-100 text-yellow-800" href="/tasks?filter=today" />
        <Stat label="Overdue" value={(overdue || []).length} color="bg-orange-100 text-orange-800" href="/missing" />
        <Stat label="In today's plan" value={(planned || []).length} color="bg-blue-100 text-blue-800" href="/today" />
        <Stat label="Open total" value={(dueTodayRaw || []).length} color="bg-slate-100 text-slate-700" href="/tasks" />
      </div>
      <div className="bg-white border border-slate-200 rounded-lg p-4">
        <h2 className="font-semibold mb-2">Quick actions</h2>
        <div className="flex flex-wrap gap-2">
          <Link href="/tasks" className="bg-blue-600 text-white text-sm px-3 py-2 rounded">+ Add a task</Link>
          <Link href="/today" className="bg-white border border-slate-300 text-sm px-3 py-2 rounded">Plan today</Link>
          <Link href="/settings" className="bg-white border border-slate-300 text-sm px-3 py-2 rounded">Add a calendar link</Link>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, color, href }: { label: string; value: number; color: string; href: string }) {
  return (
    <Link href={href} className={`block rounded-lg p-4 ${color} hover:opacity-90`}>
      <div className="text-3xl font-bold">{value}</div>
      <div className="text-xs uppercase tracking-wide">{label}</div>
    </Link>
  );
}

// ─── Landing Page (logged-out) ────────────────────────────────────────────────

function LandingPage() {
  return (
    <div className="min-h-screen">

      {/* Hero */}
      <section className="py-20 px-4 text-center bg-gradient-to-b from-blue-50 to-white rounded-2xl mb-12">
        <div className="max-w-2xl mx-auto">
          <div className="inline-block bg-blue-100 text-blue-700 text-sm font-medium px-3 py-1 rounded-full mb-6">
            Free to start · No credit card required
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 leading-tight mb-4">
            The Homework Planner<br />That Actually Gets Used
          </h1>
          <p className="text-xl text-slate-500 mb-8">
            Built by a psychologist. Syncs with Canvas, Schoology, and more. Free to start.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/login"
              className="bg-blue-600 text-white font-semibold px-8 py-3 rounded-lg text-lg hover:bg-blue-700 transition-colors"
            >
              Get Started Free
            </Link>
            <Link
              href="/upgrade"
              className="bg-white border border-amber-300 text-amber-700 font-semibold px-8 py-3 rounded-lg text-lg hover:bg-amber-50 transition-colors"
            >
              ⭐ Premium — $3.99/year
            </Link>
          </div>
        </div>
      </section>

      {/* App screenshot */}
      <section className="max-w-3xl mx-auto px-4 mb-16">
        <div className="rounded-2xl overflow-hidden shadow-xl border border-slate-200">
          <img
            src="/app-screenshot.png"
            alt="Homework Tracker dashboard showing assignments, today's plan, and quick actions"
            className="w-full h-auto"
          />
        </div>
      </section>

      {/* Section 1 — The Problem */}
      <section className="max-w-2xl mx-auto px-4 mb-16 text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">
          Most planners fail students before they even start
        </h2>
        <p className="text-lg text-slate-600 leading-relaxed">
          Students spend time entering assignments — or using tools that do it automatically — and still fall behind.
          Why? Because writing down what&apos;s due isn&apos;t the same as planning when and how to do it.
          Most students skip that step entirely, not because they don&apos;t care, but because no one has ever
          shown them a simple, low-effort way to do it.
        </p>
      </section>

      {/* Section 2 — Why This Is Different */}
      <section className="bg-slate-50 rounded-2xl px-6 py-12 mb-16 max-w-2xl mx-auto text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">
          Designed by a psychologist who works with students every day
        </h2>
        <p className="text-lg text-slate-600 leading-relaxed mb-4">
          Homework Tracker was built by a psychologist specializing in time management, organization, and executive
          function skills. After working with hundreds of students who struggled to use planners effectively, the
          framework behind this app was designed to require the bare minimum planning needed to actually follow
          through — without overwhelming you.
        </p>
        <p className="text-lg text-slate-700 font-medium">
          The result: a system that bridges the gap between &ldquo;I know what&apos;s due&rdquo; and &ldquo;I know what I&apos;m doing today.&rdquo;
        </p>
      </section>

      {/* Section 3 — Features */}
      <section className="max-w-3xl mx-auto px-4 mb-16">
        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 text-center mb-8">
          Everything you need. Nothing you don&apos;t.
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <FeatureCard
            icon="📅"
            title="Automatic Assignment Import"
            description="Connect directly to Canvas, Schoology, Google Calendar, or any calendar system using a simple .ics link. Your assignments appear automatically — no manual entry required."
            badge="Premium"
          />
          <FeatureCard
            icon="📋"
            title="Today's Plan"
            description="Each day, pull the assignments you're working on into a focused daily plan. See only what matters right now."
          />
          <FeatureCard
            icon="⏱"
            title="Time Estimation"
            description="Add estimated completion times to each task and see your total daily workload at a glance. The single most important habit for effective planning."
            badge="Premium"
          />
          <FeatureCard
            icon="⚠️"
            title="Missing Work Tracker"
            description="Automatically flags overdue assignments so nothing slips through the cracks."
          />
        </div>
      </section>

      {/* Section 4 — Pricing */}
      <section className="max-w-3xl mx-auto px-4 mb-20">
        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 text-center mb-8">
          Simple, honest pricing
        </h2>
        <div className="grid sm:grid-cols-2 gap-6">
          {/* Free */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6">
            <div className="text-3xl font-bold text-slate-900 mb-1">Free</div>
            <p className="text-slate-500 text-sm mb-5">No credit card required. Always free.</p>
            <ul className="space-y-2 text-sm text-slate-600 mb-6">
              <li className="flex gap-2"><span className="text-green-500 font-bold">✓</span> Manual assignment entry</li>
              <li className="flex gap-2"><span className="text-green-500 font-bold">✓</span> Today&apos;s Plan</li>
              <li className="flex gap-2"><span className="text-green-500 font-bold">✓</span> Missing work tracker</li>
              <li className="flex gap-2"><span className="text-green-500 font-bold">✓</span> Dashboard overview</li>
            </ul>
            <Link
              href="/login"
              className="block text-center bg-slate-100 text-slate-800 font-semibold py-2.5 rounded-lg hover:bg-slate-200 transition-colors"
            >
              Get Started Free
            </Link>
          </div>

          {/* Premium */}
          <div className="bg-white border-2 border-blue-500 rounded-2xl p-6 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">
              BEST VALUE
            </div>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-3xl font-bold text-slate-900">$3.99</span>
              <span className="text-slate-500 text-sm">/year</span>
            </div>
            <p className="text-slate-500 text-sm mb-5">Less than the cost of a coffee. Cancel anytime.</p>
            <ul className="space-y-2 text-sm text-slate-600 mb-6">
              <li className="flex gap-2"><span className="text-green-500 font-bold">✓</span> Everything in Free</li>
              <li className="flex gap-2"><span className="text-green-500 font-bold">✓</span> Calendar feed syncing (Canvas, Schoology…)</li>
              <li className="flex gap-2"><span className="text-green-500 font-bold">✓</span> Time estimation per task</li>
              <li className="flex gap-2"><span className="text-green-500 font-bold">✓</span> Total daily workload calculator</li>
            </ul>
            <Link
              href="/upgrade"
              className="block text-center bg-blue-600 text-white font-semibold py-2.5 rounded-lg hover:bg-blue-700 transition-colors"
            >
              ⭐ Upgrade to Premium
            </Link>
          </div>
        </div>
      </section>

      {/* Footer tagline */}
      <div className="text-center pb-16 text-slate-400 text-sm">
        Built for students who want a system that works — not one that adds more work.
      </div>

    </div>
  );
}

function FeatureCard({
  icon, title, description, badge,
}: {
  icon: string;
  title: string;
  description: string;
  badge?: string;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <div className="flex items-start gap-3">
        <span className="text-2xl">{icon}</span>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-slate-800">{title}</span>
            {badge && (
              <span className="text-xs bg-amber-100 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded font-medium">
                ⭐ {badge}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 leading-relaxed">{description}</p>
        </div>
      </div>
    </div>
  );
}
