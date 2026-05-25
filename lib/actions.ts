"use server";
import { revalidatePath } from "next/cache";
import { getSupabaseServer } from "./supabase/server";
import { syncFeed } from "./sync";

export async function addTask(formData: FormData) {
  const supabase = getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const title = String(formData.get("title") || "").trim();
  if (!title) return;
  const course = String(formData.get("course") || "") || null;
  const dueDate = String(formData.get("due_date") || "");
  const dueTime = String(formData.get("due_time") || "");
  const notes = String(formData.get("notes") || "") || null;
  let due_at: string | null = null;
  let is_all_day = false;
  if (dueDate) {
    if (dueTime) due_at = new Date(`${dueDate}T${dueTime}`).toISOString();
    else { due_at = new Date(`${dueDate}T23:59:00`).toISOString(); is_all_day = true; }
  }
  await supabase.from("ht_task").insert({
    user_id: user.id, title, course_name: course, description: notes, due_at, is_all_day,
    is_manual: true, source_type: "manual",
  });
  revalidatePath("/tasks"); revalidatePath("/"); revalidatePath("/today"); revalidatePath("/missing");
}

export async function toggleComplete(taskId: string, complete: boolean) {
  const supabase = getSupabaseServer();
  await supabase.from("ht_task").update({
    status: complete ? "complete" : "open",
    completed_at: complete ? new Date().toISOString() : null,
  }).eq("id", taskId);
  revalidatePath("/tasks"); revalidatePath("/"); revalidatePath("/today"); revalidatePath("/missing");
}

export async function deleteTask(taskId: string) {
  const supabase = getSupabaseServer();
  await supabase.from("ht_task").delete().eq("id", taskId);
  revalidatePath("/tasks"); revalidatePath("/"); revalidatePath("/today"); revalidatePath("/missing");
}

export async function addToToday(taskId: string, mode: "copy" | "move") {
  const supabase = getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const today = new Date().toISOString().slice(0, 10);
  await supabase.from("ht_daily_plan_item").insert({
    user_id: user.id, task_id: taskId, plan_date: today, mode,
  });
  revalidatePath("/today"); revalidatePath("/tasks"); revalidatePath("/");
}

export async function removeFromToday(itemId: string) {
  const supabase = getSupabaseServer();
  await supabase.from("ht_daily_plan_item").delete().eq("id", itemId);
  revalidatePath("/today"); revalidatePath("/");
}

export async function addFeed(formData: FormData) {
  const supabase = getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const name = String(formData.get("name") || "Calendar");
  const feed_url = String(formData.get("feed_url") || "").trim();
  if (!feed_url) return;
  // Just save the feed — don't sync immediately (avoids 10s timeout on Vercel Hobby)
  await supabase.from("ht_calendar_feed")
    .insert({ user_id: user.id, name, feed_url });
  revalidatePath("/settings"); revalidatePath("/tasks"); revalidatePath("/");
}

export async function syncOneFeed(feedId: string) {
  const supabase = getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const { data: feed } = await supabase.from("ht_calendar_feed")
    .select("*").eq("id", feedId).eq("user_id", user.id).single();
  if (feed) await syncFeed(supabase, feed);
  revalidatePath("/settings"); revalidatePath("/tasks"); revalidatePath("/"); revalidatePath("/missing");
}

export async function deleteFeed(feedId: string) {
  const supabase = getSupabaseServer();
  await supabase.from("ht_task").delete().eq("feed_id", feedId);
  await supabase.from("ht_calendar_feed").delete().eq("id", feedId);
  revalidatePath("/settings"); revalidatePath("/tasks");
}

export async function syncAllFeeds() {
  const supabase = getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const { data: feeds } = await supabase.from("ht_calendar_feed").select("*").eq("user_id", user.id).eq("is_active", true);
  for (const f of feeds || []) await syncFeed(supabase, f);
  revalidatePath("/tasks"); revalidatePath("/"); revalidatePath("/settings");
}
