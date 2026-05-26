import { getSupabaseServer } from "@/lib/supabase/server";
import { checkIsPremium } from "@/lib/premium";
import { TodayPlanList } from "./TodayPlanList";

export default async function TodayPage() {
  const supabase = getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const today = new Date().toISOString().slice(0, 10);
  const [{ data: items }, isPremium] = await Promise.all([
    supabase
      .from("ht_daily_plan_item")
      .select("id, task_id, ht_task(*)")
      .eq("user_id", user.id)
      .eq("plan_date", today)
      .order("position"),
    checkIsPremium(),
  ]);

  const validItems = (items || []).filter((it: any) => it.ht_task);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Today&apos;s plan</h1>
      <p className="text-slate-500 text-sm">
        {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
      </p>
      <TodayPlanList items={validItems as any} isPremium={isPremium} />
    </div>
  );
}
