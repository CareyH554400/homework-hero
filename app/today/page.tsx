import { getSupabaseServer } from "@/lib/supabase/server";
import { checkIsPremium } from "@/lib/premium";
import { TodayPlanList } from "./TodayPlanList";

export default async function TodayPage() {
  const supabase = getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Build 7-day window starting from today
  const dates: string[] = [];
  for (let i = 0; i < 30; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    dates.push(d.toISOString().slice(0, 10));
  }

  const startDate = dates[0];
  const endDate = dates[dates.length - 1];

  const [{ data: items }, isPremium] = await Promise.all([
    supabase
      .from("ht_daily_plan_item")
      .select("id, task_id, plan_date, ht_task(*)")
      .eq("user_id", user.id)
      .gte("plan_date", startDate)
      .lte("plan_date", endDate)
      .order("plan_date")
      .order("position"),
    checkIsPremium(),
  ]);

  const validItems = (items || []).filter((it: any) => it.ht_task);

  // Group items by date
  const grouped: Record<string, any[]> = {};
  for (const date of dates) {
    grouped[date] = validItems.filter((it: any) => it.plan_date === date);
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Plan</h1>
      <TodayPlanList grouped={grouped} dates={dates} isPremium={isPremium} />
    </div>
  );
}
