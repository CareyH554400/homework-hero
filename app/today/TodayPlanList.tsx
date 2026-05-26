"use client";
import { useState } from "react";
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
}: {
  items: PlanItem[];
  isPremium: boolean;
}) {
  const [estimates, setEstimates] = useState<Record<string, string>>({});

  const totalMinutes = items.reduce((sum, item) => {
    const val = parseInt(estimates[item.id] || "0", 10);
    return sum + (isNaN(val) ? 0 : val);
  }, 0);

  if (items.length === 0) {
    return (
      <p className="text-slate-500 text-sm">
        Nothing planned yet. Go to{" "}
        <a href="/tasks" className="text-blue-600 underline">
          Assignments
        </a>{" "}
        and tap &quot;+ Today&quot; to add work.
      </p>
    );
  }

  return (
    <div className="space-y-3">
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
                  setEstimates((prev) => ({ ...prev, [item.id]: e.target.value }))
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

      {/* Total — only shown for premium users */}
      {isPremium && (
        <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-4">
          <span className="text-sm font-semibold text-slate-700">Total time estimated</span>
          <span className="text-sm font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded px-3 py-1">
            {formatTotal(totalMinutes)}
          </span>
        </div>
      )}
    </div>
  );
}
