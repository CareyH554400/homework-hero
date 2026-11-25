import { getSupabaseServer } from "@/lib/supabase/server";
import { GradeHistory } from "./GradeHistory";

export default async function GradesPage() {
  const supabase = getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: snapshots } = await supabase
    .from("ht_grade_snapshot")
    .select("id, snapshot_date, screenshot_url, ht_grade_entry(id, class_name, grade)")
    .eq("user_id", user.id)
    .order("snapshot_date", { ascending: false });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Grade History</h1>
        <a
          href="/grades/upload"
          className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
        >
          + Log Grades
        </a>
      </div>
      <GradeHistory snapshots={(snapshots as any) || []} />
    </div>
  );
}
