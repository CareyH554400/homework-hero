import { getSupabaseServer } from "@/lib/supabase/server";
import { addFeed, deleteFeed, syncOneFeed, syncAllFeeds } from "@/lib/actions";

export default async function SettingsPage() {
  const supabase = getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: feeds } = await supabase.from("ht_calendar_feed").select("*").eq("user_id", user.id).order("created_at");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <section className="bg-white border border-slate-200 rounded-lg p-4">
        <h2 className="font-semibold mb-3">Calendar feeds</h2>
        <p className="text-sm text-slate-500 mb-4">
          Paste an .ics link from Canvas, Schoology, Google Calendar, or any other source.
          After adding, click the Sync button next to the feed to import tasks.
        </p>

        <form action={addFeed} className="grid gap-2 mb-4">
          <input name="name" placeholder="Name (e.g. Canvas)" required className="border border-slate-300 rounded px-3 py-2" />
          <input name="feed_url" placeholder="https://... or webcal://..." required className="border border-slate-300 rounded px-3 py-2" />
          <button type="submit" className="bg-blue-600 text-white rounded px-4 py-2 font-medium hover:bg-blue-700 active:bg-blue-800">
            Add feed
          </button>
        </form>

        <ul className="space-y-2">
          {(feeds || []).length === 0 && <li className="text-sm text-slate-400">No feeds yet.</li>}
          {(feeds || []).map((f: any) => (
            <li key={f.id} className="border border-slate-200 rounded p-3">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{f.name}</div>
                  <div className="text-xs text-slate-500 truncate">{f.feed_url}</div>
                  <div className="text-xs text-slate-400 mt-1">
                    {f.last_synced_at ? `Last synced: ${new Date(f.last_synced_at).toLocaleString()}` : "Never synced"}
                  </div>
                  {f.last_error && <div className="text-xs text-red-600 mt-1">Error: {f.last_error}</div>}
                </div>
                <div className="flex gap-2 shrink-0">
                  <form action={async () => { "use server"; await syncOneFeed(f.id); }}>
                    <button type="submit" className="text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded px-3 py-1.5 hover:bg-blue-100 active:bg-blue-200 font-medium">
                      Sync
                    </button>
                  </form>
                  <form action={async () => { "use server"; await deleteFeed(f.id); }}>
                    <button type="submit" className="text-xs text-red-600 border border-red-200 rounded px-3 py-1.5 hover:bg-red-50">
                      Remove
                    </button>
                  </form>
                </div>
              </div>
            </li>
          ))}
        </ul>

        {(feeds || []).length > 0 && (
          <form action={syncAllFeeds} className="mt-4">
            <button type="submit" className="bg-white border border-slate-300 rounded px-4 py-2 text-sm font-medium hover:bg-slate-50 active:bg-slate-100">
              Sync all feeds
            </button>
          </form>
        )}
      </section>

      <section className="bg-white border border-slate-200 rounded-lg p-4">
        <h2 className="font-semibold mb-2">Account</h2>
        <p className="text-sm text-slate-500">Signed in as <strong>{user.email}</strong></p>
      </section>
    </div>
  );
}
