import { parseIcs } from "./ics";

export async function syncFeed(supabase: any, feed: { id: string; user_id: string; feed_url: string; name: string }) {
  try {
    // Many Canvas/Schoology links use webcal:// — normalize to https
    const url = feed.feed_url.replace(/^webcal:/i, "https:");
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
    const text = await res.text();
    const events = parseIcs(text);

    for (const ev of events) {
      const due = ev.start?.toISOString() ?? null;
      // Try to extract course name from "[COURSE] Title" or "Title (COURSE)"
      let course: string | null = null;
      let title = ev.summary;
      const m1 = title.match(/^\[([^\]]+)\]\s*(.+)$/);
      const m2 = title.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
      if (m1) { course = m1[1]; title = m1[2]; }
      else if (m2) { title = m2[1]; course = m2[2]; }

      const { error: upsertErr } = await supabase.from("ht_task").upsert(
        {
          user_id: feed.user_id,
          source_type: "ics",
          feed_id: feed.id,
          source_event_uid: ev.uid,
          title,
          course_name: course,
          description: ev.description ?? null,
          due_at: due,
          is_all_day: ev.isAllDay,
          is_manual: false,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,feed_id,source_event_uid", ignoreDuplicates: false }
      );
      if (upsertErr) throw new Error(`Upsert failed: ${upsertErr.message}`);
    }
    await supabase
      .from("ht_calendar_feed")
      .update({ last_synced_at: new Date().toISOString(), last_error: null })
      .eq("id", feed.id);
    return { ok: true, count: events.length };
  } catch (e: any) {
    await supabase
      .from("ht_calendar_feed")
      .update({ last_error: String(e.message ?? e) })
      .eq("id", feed.id);
    return { ok: false, error: String(e.message ?? e) };
  }
}
