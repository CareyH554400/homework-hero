import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { syncFeed } from "@/lib/sync";

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  // Service role required to sync across all users in cron
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );
  const { data: feeds } = await sb.from("ht_calendar_feed").select("*").eq("is_active", true);
  let ok = 0, fail = 0;
  for (const f of feeds || []) {
    const r = await syncFeed(sb, f);
    if (r.ok) ok++; else fail++;
  }
  return NextResponse.json({ ok, fail, total: (feeds || []).length });
}
