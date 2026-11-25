"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { saveGradeSnapshot } from "@/lib/actions";

type Entry = { class_name: string; grade: string };

export default function UploadGradesPage() {
  const router = useRouter();
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [file, setFile] = useState<File | null>(null);
  const [entries, setEntries] = useState<Entry[]>([
    { class_name: "", grade: "" },
    { class_name: "", grade: "" },
    { class_name: "", grade: "" },
  ]);
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function updateEntry(i: number, field: keyof Entry, value: string) {
    setEntries((prev) => prev.map((e, idx) => idx === i ? { ...e, [field]: value } : e));
  }

  function addRow() {
    setEntries((prev) => [...prev, { class_name: "", grade: "" }]);
  }

  function removeRow(i: number) {
    setEntries((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    const validEntries = entries.filter((e) => e.class_name.trim() && e.grade.trim());
    if (validEntries.length === 0) { setErr("Add at least one class and grade."); return; }

    start(async () => {
      let screenshotUrl: string | null = null;

      if (file) {
        const supabase = getSupabaseBrowser();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const path = `${user.id}/${Date.now()}-${file.name}`;
          const { error: uploadError } = await supabase.storage
            .from("grade-screenshots")
            .upload(path, file, { upsert: false });
          if (!uploadError) {
            const { data } = supabase.storage.from("grade-screenshots").getPublicUrl(path);
            screenshotUrl = data?.publicUrl || null;
          }
        }
      }

      await saveGradeSnapshot(date, screenshotUrl, validEntries);
      router.push("/grades");
      router.refresh();
    });
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Log Grades</h1>
        <p className="text-sm text-slate-500 mt-1">Upload your gradebook screenshot and enter your current grades.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Date */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* Screenshot upload */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">Gradebook Screenshot <span className="text-slate-400 font-normal">(optional)</span></label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full text-sm text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-sm file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>

        {/* Grade entries */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Grades by Class</label>
          <div className="space-y-2">
            {entries.map((entry, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input
                  type="text"
                  placeholder="Class name"
                  value={entry.class_name}
                  onChange={(e) => updateEntry(i, "class_name", e.target.value)}
                  className="flex-1 border border-slate-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <input
                  type="text"
                  placeholder="Grade"
                  value={entry.grade}
                  onChange={(e) => updateEntry(i, "grade", e.target.value)}
                  className="w-24 border border-slate-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                {entries.length > 1 && (
                  <button type="button" onClick={() => removeRow(i)} className="text-slate-400 hover:text-red-500 text-sm">✕</button>
                )}
              </div>
            ))}
          </div>
          <button type="button" onClick={addRow} className="text-sm text-blue-600 hover:underline">+ Add class</button>
        </div>

        {err && <p className="text-red-600 text-sm">{err}</p>}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={pending}
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {pending ? "Saving..." : "Save grades"}
          </button>
          <a href="/grades" className="px-4 py-2 rounded-md text-sm text-slate-600 hover:bg-slate-100 border border-slate-200">
            Cancel
          </a>
        </div>
      </form>
    </div>
  );
}
