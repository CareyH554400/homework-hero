import { getSupabaseServer } from "@/lib/supabase/server";
import { checkIsPremium } from "@/lib/premium";
import { TodayPlanList } from "./TodayPlanList";
import { RemindersSection } from "./RemindersSection";

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

  const [{ data: items }, { data: reminders }, isPremium] = await Promise.all([
    supabase
      .from("ht_daily_plan_item")
      .select("id, task_id, plan_date, estimated_minutes, scheduled_time, ht_task(*)")
      .eq("user_id", user.id)
      .gte("plan_date", startDate)
      .lte("plan_date", endDate)
      .order("plan_date")
      .order("position"),
    supabase.from("ht_reminder").select("id, text").eq("user_id", user.id).order("created_at"),
    checkIsPremium(),
  ]);

  const validItems = (items || []).filter((it: any) => it.ht_task);

  // Group items by date
  const grouped: Record<string, any[]> = {};
  for (const date of dates) {
    grouped[date] = validItems.filter((it: any) => it.plan_date === date);
  }

  // Build initial estimates and scheduled times maps from saved DB values
  const initialEstimates: Record<string, string> = {};
  const initialTimes: Record<string, string> = {};
  for (const item of validItems) {
    if (item.estimated_minutes) {
      initialEstimates[item.id] = String(item.estimated_minutes);
    }
    if (item.scheduled_time) {
      initialTimes[item.id] = item.scheduled_time;
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Plan</h1>
      <RemindersSection initialReminders={reminders || []} />
      <TodayPlanList grouped={grouped} dates={dates} isPremium={isPremium} initialEstimates={initialEstimates} initialTimes={initialTimes} />
    </div>
  );
}
