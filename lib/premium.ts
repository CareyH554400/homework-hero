import { getSupabaseServer } from "./supabase/server";

/** Returns true if the currently signed-in user has premium access. */
export async function checkIsPremium(): Promise<boolean> {
  const supabase = getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase
    .from("ht_profile")
    .select("is_premium")
    .eq("id", user.id)
    .single();
  return data?.is_premium === true;
}
