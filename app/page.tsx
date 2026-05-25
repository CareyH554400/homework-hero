import { getSupabaseServer } from "@/lib/supabase/server";
import Link from "next/link";

export default async function Dashboard() {
  const supabase = getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowIso = tomorrow.toISOString();
  const nowIso = new Date().toISOString();

  const { data: dueTodayRaw } = await supabase.from("ht_task").select("*")
    .eq("user_id", user.id).eq("status", "open").lte("due_at", tomorrowIso).order("due_at");
  const dueToday = (dueTodayRaw || []).filter((t) => t.due_at && t.due_at.slice(0, 10) === today);
  const { data: overdue } = await supabase.from("ht_task").select("*")
    .eq("user_id", user.id).eq("status", "open").lt("due_at", today + "T00:00:00Z").order("due_at");
  const { data: planned } = await supabase.from("ht_daily_plan_item").select("*")
    .eq("user_id", user.id).eq("plan_date", today);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-1">Hi 👋</h1>
        <p className="text-slate-500">Here's where things stand right now.</p>
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
