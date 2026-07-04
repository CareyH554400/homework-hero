import { getSupabaseServer } from "@/lib/supabase/server";
import { checkIsPremium } from "@/lib/premium";
import { TodayPlanList } from "./TodayPlanList";

export default async function TodayPage({ searchParams }: { searchParams: { date?: string } }) {
  const supabase = getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const today = new Date().toISOString().slice(0, 10);
  const dateStr = searchParams.date || today;

  const [{ data: items }, isPremium] = await Promise.all([
    supabase
      .from("ht_daily_plan_item")
      .select("id, task_id, ht_task(*)")
      .eq("user_id", user.id)
      .eq("plan_date", dateStr)
      .order("position"),
    checkIsPremium(),
  ]);

  const validItems = (items || []).filter((it: any) => it.ht_task);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Plan</h1>
      <TodayPlanList items={validItems as any} isPremium={isPremium} dateStr={dateStr} />
    </div>
  );
}
