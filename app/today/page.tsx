import { getSupabaseServer } from "@/lib/supabase/server";
import { TaskCard } from "../components";

export default async function TodayPage() {
  const supabase = getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const today = new Date().toISOString().slice(0, 10);
  const { data: items } = await supabase
    .from("ht_daily_plan_item")
    .select("id, task_id, ht_task(*)")
    .eq("user_id", user.id)
    .eq("plan_date", today)
    .order("position");

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Today's plan</h1>
      <p className="text-slate-500 text-sm">{new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</p>
      <div className="space-y-2">
        {(items || []).length === 0 && (
          <p className="text-slate-500 text-sm">Nothing planned yet. Go to <a href="/tasks" className="text-blue-600 underline">Assignments</a> and tap "+ Today" to add work.</p>
        )}
        {(items || []).map((it: any) => it.ht_task && <TaskCard key={it.id} task={it.ht_task} planItemId={it.id} />)}
      </div>
    </div>
  );
}
