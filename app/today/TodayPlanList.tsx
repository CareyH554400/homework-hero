"use client";
import { useState } from "react";
import Link from "next/link";
import { TaskCard } from "../components";
import type { Task } from "../components";

type PlanItem = {
  id: string;
  task_id: string;
  plan_date: string;
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
  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().slice(0, 10);
  if (dateStr === today) return "Today";
  if (dateStr === tomorrowStr) return "Tomorrow";
  const d = new Date(dateStr + "T00:00:00");
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

function DaySection({
  date,
  items,
  isPremium,
  estimates,
  setEstimates,
}: {
  date: string;
  items: PlanItem[];
  isPremium: boolean;
  estimates: Record<string, string>;
  setEstimates: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const isToday = date === today;

  const totalMinutes = items.reduce((sum, item) => {
    const val = parseInt(estimates[item.id] || "0", 10);
    return sum + (isNaN(val) ? 0 : val);
  }, 0);

  return (
    <div
      className={`rounded-xl border p-4 space-y-3 ${
        isToday
          ? "border-blue-300 bg-blue-50/40"
          : "border-slate-200 bg-white"
      }`}
    >
      {/* Day header */}
      <div className="flex items-center gap-2">
        <h2
          className={`font-semibold text-base ${
            isToday ? "text-blue-700" : "text-slate-700"
          }`}
        >
          {formatDisplayDate(date)}
        </h2>
        {isToday && (
          <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full font-medium">
            Today
          </span>
        )}
        <span className="text-xs text-slate-400 ml-auto">
          {items.length} item{items.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Items */}
      {items.length === 0 ? (
        <p className="text-sm text-slate-400 italic">
          Nothing planned.{" "}
          <a href="/tasks" className="text-blue-500 underline">
            Go to Assignments
          </a>{" "}
          and tap 📅 to schedule work here.
        </p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="space-y-1">
              <TaskCard task={item.ht_task} planItemId={item.id} showAddToday={false} />
              {isPremium ? (
                <div className="flex items-center gap-2 pl-1">
                  <label
                    htmlFor={`est-${item.id}`}
                    className="text-xs text-slate-500 whitespace-nowrap"
                  >
                    Estimated completion time:
                  </label>
                  <input
                    id={`est-${item.id}`}
                    type="number"
                    min="0"
                    step="5"
                    placeholder="0"
                    value={estimates[item.id] ?? ""}
                    onChange={(e) =>
                      setEstimates((prev) => ({
                        ...prev,
                        [item.id]: e.target.value,
                      }))
                    }
                    className="w-20 border border-slate-300 rounded px-2 py-0.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                  <span className="text-xs text-slate-400">min</span>
                </div>
              ) : (
                <PremiumTimeGate />
              )}
            </div>
          ))}

          {isPremium && totalMinutes > 0 && (
            <div className="flex items-center justify-between border-t border-slate-200 pt-2 mt-2">
              <span className="text-xs font-semibold text-slate-600">
                Total estimated
              </span>
              <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded px-2 py-0.5">
                {formatTotal(totalMinutes)}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function TodayPlanList({
  grouped,
  dates,
  isPremium,
}: {
  grouped: Record<string, PlanItem[]>;
  dates: string[];
  isPremium: boolean;
}) {
  const [estimates, setEstimates] = useState<Record<string, string>>({});

  return (
    <div className="space-y-4">
      {dates.map((date) => (
        <DaySection
          key={date}
          date={date}
          items={grouped[date] || []}
          isPremium={isPremium}
          estimates={estimates}
          setEstimates={setEstimates}
        />
      ))}
    </div>
  );
}
