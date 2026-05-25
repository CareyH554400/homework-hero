import { getSupabaseServer } from "@/lib/supabase/server";
import { TaskCard } from "../components";

export default async function MissingPage() {
  const supabase = getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const { data: tasks } = await supabase.from("ht_task").select("*")
    .eq("user_id", user.id).eq("status", "open").lt("due_at", today.toISOString())
    .order("due_at", { ascending: true });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-red-600">Missing & overdue</h1>
      <p className="text-slate-500 text-sm">These are open assignments past their due date. Tackle the most overdue first.</p>
      <div className="space-y-2">
        {(tasks || []).length === 0 && <p className="text-emerald-600 text-sm font-medium">🎉 Nothing missing. Great work!</p>}
        {(tasks || []).map((t: any) => <TaskCard key={t.id} task={t} />)}
      </div>
    </div>
  );
}
