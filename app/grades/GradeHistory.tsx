"use client";
import { useState, useTransition } from "react";
import { deleteGradeSnapshot } from "@/lib/actions";

type Entry = { id: string; class_name: string; grade: string };
type Snapshot = {
  id: string;
  snapshot_date: string;
  screenshot_url: string | null;
  ht_grade_entry: Entry[];
};

function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString(undefined, {
    weekday: "short", month: "short", day: "numeric", year: "numeric"
  });
}

function GradeTag({ grade }: { grade: string }) {
  const num = parseFloat(grade);
  const color = isNaN(num)
    ? "bg-slate-100 text-slate-700"
    : num >= 90 ? "bg-green-100 text-green-800"
    : num >= 80 ? "bg-blue-100 text-blue-800"
    : num >= 70 ? "bg-yellow-100 text-yellow-800"
    : "bg-red-100 text-red-800";
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded ${color}`}>{grade}</span>;
}

function SnapshotCard({ snapshot, onDelete }: { snapshot: Snapshot; onDelete: (id: string) => void }) {
  const [expanded, setExpanded] = useState(true);
  const [pending, start] = useTransition();
  const [showImg, setShowImg] = useState(false);

  function handleDelete() {
    if (!confirm("Delete this grade log entry?")) return;
    start(async () => {
      await deleteGradeSnapshot(snapshot.id);
      onDelete(snapshot.id);
    });
  }

  return (
    <div className="border border-slate-200 rounded-xl bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
        <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-2 font-semibold text-slate-700 hover:text-slate-900">
          <span>{expanded ? "▾" : "▸"}</span>
          <span>{formatDate(snapshot.snapshot_date)}</span>
          <span className="text-xs text-slate-400 font-normal">{snapshot.ht_grade_entry.length} classes</span>
        </button>
        <div className="flex items-center gap-2">
          {snapshot.screenshot_url && (
            <button onClick={() => setShowImg(!showImg)} className="text-xs text-blue-600 hover:underline">
              {showImg ? "Hide screenshot" : "View screenshot"}
            </button>
          )}
          <button onClick={handleDelete} disabled={pending} className="text-xs text-slate-400 hover:text-red-500">
            {pending ? "..." : "Delete"}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-4 py-3 space-y-3">
          {/* Screenshot */}
          {showImg && snapshot.screenshot_url && (
            <img
              src={snapshot.screenshot_url}
              alt="Gradebook screenshot"
              className="w-full rounded-lg border border-slate-200 max-h-64 object-contain bg-slate-50"
            />
          )}

          {/* Grade table */}
          <div className="divide-y divide-slate-100">
            {snapshot.ht_grade_entry.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between py-1.5">
                <span className="text-sm text-slate-700">{entry.class_name}</span>
                <GradeTag grade={entry.grade} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function GradeHistory({ snapshots: initial }: { snapshots: Snapshot[] }) {
  const [snapshots, setSnapshots] = useState(initial);

  if (snapshots.length === 0) {
    return (
      <div className="text-center py-16 text-slate-400">
        <p className="text-4xl mb-3">📊</p>
        <p className="font-medium">No grade logs yet</p>
        <p className="text-sm mt-1">Click <strong>+ Log Grades</strong> to add your first entry.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {snapshots.map((s) => (
        <SnapshotCard
          key={s.id}
          snapshot={s}
          onDelete={(id) => setSnapshots((prev) => prev.filter((x) => x.id !== id))}
        />
      ))}
    </div>
  );
}
