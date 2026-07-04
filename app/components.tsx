"use client";
import { toggleComplete, deleteTask, addToToday, removeFromToday } from "@/lib/actions";
import { useState, useTransition } from "react";

export type Task = {
  id: string;
  title: string;
  course_name: string | null;
  due_at: string | null;
  is_all_day: boolean;
  status: string;
  source_type: string;
  description: string | null;
};

function fmtDue(due_at: string | null, all_day: boolean) {
  if (!due_at) return "No due date";
  const d = new Date(due_at);
  const now = new Date();
  const ymd = (x: Date) => x.toISOString().slice(0, 10);
  const isToday = ymd(d) === ymd(now);
  const tomorrow = new Date(now); tomorrow.setDate(now.getDate() + 1);
  const isTomorrow = ymd(d) === ymd(tomorrow);
  const overdue = d.getTime() < now.getTime();
  const dateStr = isToday ? "Today" : isTomorrow ? "Tomorrow" : d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const timeStr = all_day ? "" : ` ${d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}`;
  return { text: `${dateStr}${timeStr}`, overdue: overdue && !isToday, today: isToday };
}

export function TaskCard({ task, planItemId, showAddToday = true }: { task: Task; planItemId?: string; showAddToday?: boolean }) {
  const [pending, start] = useTransition();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickedDate, setPickedDate] = useState("");
  const [scheduled, setScheduled] = useState(false);

  const due = fmtDue(task.due_at, task.is_all_day);
  const dueObj = typeof due === "string" ? { text: due, overdue: false, today: false } : due;
  const complete = task.status === "complete";

  // Minimum date = today
  const todayStr = new Date().toISOString().slice(0, 10);

  function handleSchedule() {
    if (!pickedDate) return;
    start(async () => {
      await addToToday(task.id, "copy", pickedDate);
      setShowDatePicker(false);
      setPickedDate("");
      setScheduled(true);
      setTimeout(() => setScheduled(false), 3000);
    });
  }

  return (
    <div className={`border rounded-lg p-3 bg-white ${dueObj.overdue && !complete ? "border-orange-400 bg-orange-50" : "border-slate-200"} ${complete ? "opacity-60" : ""}`}>
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={complete}
          onChange={(e) => start(() => toggleComplete(task.id, e.target.checked))}
          className="mt-1 h-5 w-5 cursor-pointer"
        />
        <div className="flex-1 min-w-0">
          <div className={`font-medium ${complete ? "line-through" : ""}`}>{task.title}</div>
          <div className="flex flex-wrap gap-2 mt-1 text-xs">
            {task.course_name && <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded">{task.course_name}</span>}
            <span className={`px-2 py-0.5 rounded ${dueObj.overdue && !complete ? "bg-orange-200 text-orange-800" : dueObj.today ? "bg-yellow-100 text-yellow-800" : "bg-slate-100 text-slate-600"}`}>
              {dueObj.overdue && !complete ? "⚠ " : ""}{dueObj.text}
            </span>
            <span className="text-slate-400">{task.source_type === "ics" ? "📅 imported" : "✏ manual"}</span>
          </div>

          {/* Date picker (shown when 📅 is clicked) */}
          {showDatePicker && (
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <input
                type="date"
                min={todayStr}
                value={pickedDate}
                onChange={(e) => setPickedDate(e.target.value)}
                className="border border-slate-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <button
                onClick={handleSchedule}
                disabled={!pickedDate || pending}
                className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 disabled:opacity-40"
              >
                Schedule
              </button>
              <button
                onClick={() => { setShowDatePicker(false); setPickedDate(""); }}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                Cancel
              </button>
            </div>
          )}

          {scheduled && (
            <p className="text-xs text-green-600 mt-1">✓ Added to your plan for {new Date(pickedDate + "T00:00:00").toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</p>
          )}
        </div>

        <div className="flex flex-col gap-1 items-end shrink-0">
          {planItemId ? (
            <button onClick={() => start(() => removeFromToday(planItemId))} className="text-xs text-slate-500 hover:text-red-600" disabled={pending}>Remove</button>
          ) : showAddToday && !complete ? (
            <div className="flex gap-1">
              <button
                onClick={() => start(() => addToToday(task.id, "copy"))}
                className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                disabled={pending}
                title="Add to today's plan"
              >
                + Today
              </button>
              <button
                onClick={() => { setShowDatePicker(!showDatePicker); setPickedDate(""); }}
                className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded hover:bg-slate-200 border border-slate-300"
                disabled={pending}
                title="Schedule for a specific day"
              >
                📅
              </button>
            </div>
          ) : null}
          {!planItemId && (
            <button onClick={() => { if (confirm("Delete this task?")) start(() => deleteTask(task.id)); }} className="text-xs text-slate-400 hover:text-red-600" disabled={pending}>✕</button>
          )}
        </div>
      </div>
    </div>
  );
}
