"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { TaskCard } from "../components";
import type { Task } from "../components";

type PlanItem = {
  id: string;
  task_id: string;
  ht_task: Task;
};

function formatTotal(totalMinutes: number): string {
  if (totalMinutes === 0) return "0 min";
  const hrs = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (hrs === 0) return `${mins} min`;
  if (mins === 0) return `${hrs} hr`;
  return `${hrs} hr ${mins} min`;
}

function formatDisplayDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().slice(0, 10);
  if (dateStr === today) return "Today";
  if (dateStr === tomorrowStr) return "Tomorrow";
  return d.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
}

function PremiumTimeGate() {
  return (
    <div className="flex items-center gap-2 pl-1 py-1">
      <span className="text-xs text-slate-400">⏱ Estimated completion time:</span>
      <Link
        href="/upgrade"
        className="inline-flex items-center gap-1 text-xs bg-amber-50 border border-amber-300 text-amber-700 px-2 py-0.5 rounded hover:bg-amber-100 transition-colors font-medium"
      >
        🔒 Premium feature — Upgrade ⭐
      </Link>
    </div>
  );
}

export function TodayPlanList({
  items,
  isPremium,
  dateStr,
}: {
  items: PlanItem[];
  isPremium: boolean;
  dateStr: string;
}) {
  const router = useRouter();
  const [estimates, setEstimates] = useState<Record<string, string>>({});

  const totalMinutes = items.reduce((sum, item) => {
    const val = parseInt(estimates[item.id] || "0", 10);
    return sum + (isNaN(val) ? 0 : val);
  }, 0);

  function prevDay() {
    const d = new Date(dateStr + "T00:00:00");
    d.setDate(d.getDate() - 1);
    router.push(`/today?date=${d.toISOString().slice(0, 10)}`);
  }

  function nextDay() {
    const d = new Date(dateStr + "T00:00:00");
    d.setDate(d.getDate() + 1);
    router.push(`/today?date=${d.toISOString().slice(0, 10)}`);
  }

  function goToToday() {
    router.push("/today");
  }

  const today = new Date().toISOString().slice(0, 10);
  const isToday = dateStr === today;

  return (
    <div className="space-y-4">
      {/* Date navigation */}
      <div className="flex items-center gap-2">
        <button
          onClick={prevDay}
          className="p-1.5 rounded-md border border-slate-200 hover:bg-slate-100 text-slate-600 text-sm"
          title="Previous day"
        >
          ←
        </button>
        <span className="text-base font-semibold text-slate-800 min-w-[160px] text-center">
          {formatDisplayDate(dateStr)}
        </span>
        <button
          onClick={nextDay}
          className="p-1.5 rounded-md border border-slate-200 hover:bg-slate-100 text-slate-600 text-sm"
          title="Next day"
        >
          →
        </button>
        {!isToday && (
          <button
            onClick={goToToday}
            className="ml-2 text-xs text-blue-600 border border-blue-200 px-2 py-1 rounded hover:bg-blue-50"
          >
            Back to Today
          </button>
        )}
      </div>

      {/* Plan items */}
      {items.length === 0 ? (
        <p className="text-slate-500 text-sm">
          Nothing planned for {formatDisplayDate(dateStr).toLowerCase()}. Go to{" "}
          <a href="/tasks" className="text-blue-600 underline">Assignments</a>{" "}
          and tap &quot;📅&quot; to schedule work for this day.
        </p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="space-y-1">
              <TaskCard task={item.ht_task} planItemId={item.id} showAddToday={false} />
              {isPremium ? (
                <div className="flex items-center gap-2 pl-1">
                  <label htmlFor={`est-${item.id}`} className="text-xs text-slate-500 whitespace-nowrap">
                    Estimated completion time:
                  </label>
                  <input
                    id={`est-${item.id}`}
                    type="number"
                    min="0"
                    step="5"
                    placeholder="0"
                    value={estimates[item.id] ?? ""}
                    onChange={(e) => setEstimates((prev) => ({ ...prev, [item.id]: e.target.value }))}
                    className="w-20 border border-slate-300 rounded px-2 py-0.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                  <span className="text-xs text-slate-400">min</span>
                </div>
              ) : (
                <PremiumTimeGate />
              )}
            </div>
          ))}

          {isPremium && (
            <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-4">
              <span className="text-sm font-semibold text-slate-700">Total time estimated</span>
              <span className="text-sm font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded px-3 py-1">
                {formatTotal(totalMinutes)}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
