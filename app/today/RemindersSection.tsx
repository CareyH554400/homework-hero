"use client";
import { useState, useTransition } from "react";
import { addReminder, deleteReminder } from "@/lib/actions";

type Reminder = { id: string; text: string };

export function RemindersSection({ initialReminders }: { initialReminders: Reminder[] }) {
  const [reminders, setReminders] = useState<Reminder[]>(initialReminders);
  const [text, setText] = useState("");
  const [pending, start] = useTransition();

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    const tempId = crypto.randomUUID();
    setReminders((prev) => [...prev, { id: tempId, text: trimmed }]);
    setText("");
    start(async () => {
      await addReminder(trimmed);
    });
  }

  function handleDelete(id: string) {
    setReminders((prev) => prev.filter((r) => r.id !== id));
    start(async () => {
      await deleteReminder(id);
    });
  }

  return (
    <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 space-y-3">
      <h2 className="font-semibold text-amber-800 text-sm flex items-center gap-1.5">
        📌 Reminders
      </h2>

      {reminders.length === 0 && (
        <p className="text-xs text-amber-600 italic">No reminders yet — add one below.</p>
      )}

      {reminders.length > 0 && (
        <ul className="space-y-1.5">
          {reminders.map((r) => (
            <li key={r.id} className="flex items-start gap-2">
              <span className="text-amber-500 mt-0.5">•</span>
              <span className="flex-1 text-sm text-amber-900">{r.text}</span>
              <button
                onClick={() => handleDelete(r.id)}
                className="text-amber-400 hover:text-red-500 text-xs mt-0.5 shrink-0"
                title="Remove reminder"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a reminder..."
          className="flex-1 border border-amber-300 bg-white rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 placeholder:text-amber-400"
        />
        <button
          type="submit"
          disabled={pending || !text.trim()}
          className="bg-amber-500 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-amber-600 disabled:opacity-40"
        >
          Add
        </button>
      </form>
    </div>
  );
}
