import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabase: SupabaseClient | null = url && anon ? createClient(url, anon, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }) : null;

export async function signInStaff(email: string, password: string) {
  if (!supabase) return { ok: false, error: "Supabase authentication is not configured." };
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function signOutStaff() {
  if (supabase) await supabase.auth.signOut();
  sessionStorage.removeItem("entria:staff-session");
  sessionStorage.removeItem("entria:staff-email");
}

export async function restoreStaffSession() {
  if (!supabase) return sessionStorage.getItem("entria:staff-session") === "preview-authenticated";
  const { data } = await supabase.auth.getSession();
  return Boolean(data.session);
}
