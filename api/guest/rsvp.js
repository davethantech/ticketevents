import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false } });

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { invite_code: inviteCode, status, confirmed_guests: confirmedGuests = 1 } = req.body || {};
  if (!inviteCode || !["confirmed", "declined", "waitlist"].includes(status)) return res.status(400).json({ error: "Invalid RSVP request" });
  const { data, error } = await supabase.rpc("rsvp_guest", { p_invite_code: String(inviteCode), p_status: status, p_confirmed_guests: Number(confirmedGuests) });
  if (error) return res.status(500).json({ error: error.message });
  const result = data?.[0];
  if (!result?.ok) return res.status(409).json({ ok: false, status: result?.status || "invalid", allowed_guests: result?.allowed_guests || 0 });
  return res.status(200).json(result);
}
