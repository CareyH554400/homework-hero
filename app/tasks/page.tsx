import { getSupabaseServer } from "@/lib/supabase/server";
import { addTask } from "@/lib/actions";
import { TaskCard } from "../components";

export default async function TasksPage({ searchParams }: { searchParams: { filter?: string; q?: string } }) {
  const supabase = getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const filter = searchParams.filter || "all";
  const q = searchParams.q || "";

  let query = supabase.from("ht_task").select("*").eq("user_id", user.id);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
  const weekOut = new Date(today); weekOut.setDate(weekOut.getDate() + 7);

  if (filter === "today") query = query.eq("status", "open").gte("due_at", today.toISOString()).lt("due_at", tomorrow.toISOString());
  else if (filter === "upcoming") query = query.eq("status", "open").gte("due_at", tomorrow.toISOString()).lt("due_at", weekOut.toISOString());
  else if (filter === "overdue") query = query.eq("status", "open").lt("due_at", today.toISOString());
  else if (filter === "completed") query = query.eq("status", "complete");
  else query = query.neq("status", "archived");

  if (q) query = query.ilike("title", `%${q}%`);
  const { data: tasks } = await query.order("due_at", { ascending: true, nullsFirst: false }).limit(500);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Assignments</h1>

      <details className="bg-white border border-slate-200 rounded-lg p-4">
        <summary className="font-medium cursor-pointer">+ Add a task manually</summary>
        <form action={addTask} className="grid gap-3 mt-4">
          <input name="title" required placeholder="Title (e.g. Read Ch. 4)" className="border border-slate-300 rounded px-3 py-2" />
          <input name="course" placeholder="Course / class (optional)" className="border border-slate-300 rounded px-3 py-2" />
          <div className="grid grid-cols-2 gap-3">
            <input name="due_date" type="date" className="border border-slate-300 rounded px-3 py-2" />
            <input name="due_time" type="time" className="border border-slate-300 rounded px-3 py-2" />
          </div>
          <textarea name="notes" placeholder="Notes (optional)" className="border border-slate-300 rounded px-3 py-2" rows={2} />
          <button className="bg-blue-600 text-white rounded px-4 py-2 font-medium">Add task</button>
        </form>
      </details>

      <div className="flex flex-wrap gap-2">
        {[
          ["all", "All"],
          ["today", "Today"],
          ["upcoming", "Next 7 days"],
          ["overdue", "Overdue"],
          ["completed", "Completed"],
        ].map(([f, label]) => (
          <a key={f} href={`/tasks?filter=${f}`} className={`text-sm px-3 py-1.5 rounded-full border ${filter === f ? "bg-blue-600 text-white border-blue-600" : "bg-white border-slate-300 text-slate-700"}`}>
            {label}
          </a>
        ))}
      </div>

      <form action="/tasks" method="get">
        <input type="hidden" name="filter" value={filter} />
        <input name="q" defaultValue={q} placeholder="Search tasks..." className="w-full border border-slate-300 rounded px-3 py-2" />
      </form>

      <div className="space-y-2">
        {(tasks || []).length === 0 && <p className="text-slate-500 text-sm">No tasks here. Add one above or connect a calendar in Settings.</p>}
        {(tasks || []).map((t: any) => <TaskCard key={t.id} task={t} />)}
      </div>
    </div>
  );
}
