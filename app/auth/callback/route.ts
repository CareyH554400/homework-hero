import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

// Handles the confirmation link Supabase sends in signup emails.
// Supports both ?code= (PKCE) and ?token_hash=&type= flows.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const token_hash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as any;
  const next = url.searchParams.get("next") || "/";
  const supabase = getSupabaseServer();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, url.origin));
    return NextResponse.redirect(new URL(`/login?err=${encodeURIComponent(error.message)}`, url.origin));
  }
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) return NextResponse.redirect(new URL(next, url.origin));
    return NextResponse.redirect(new URL(`/login?err=${encodeURIComponent(error.message)}`, url.origin));
  }
  return NextResponse.redirect(new URL("/login?err=Missing+code", url.origin));
}
