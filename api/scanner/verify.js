import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const admin = createClient(url, secret, { auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false } });

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const token = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!token) return res.status(401).json({ error: "Authentication required" });

  const caller = createClient(url, process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY, { auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false } });
  const { data: authData, error: authError } = await caller.auth.getUser(token);
  if (authError || !authData.user) return res.status(401).json({ error: "Invalid staff session" });

  const { event_id: eventId, signature } = req.body || {};
  if (!eventId || !signature) return res.status(400).json({ error: "event_id and signature are required" });

  const { data: event, error: eventError } = await admin.from("events").select("id,organization_id").eq("id", eventId).single();
  if (eventError || !event) return res.status(404).json({ error: "Event not found" });
  const { data: membership, error: membershipError } = await admin.from("organization_members")
    .select("role,status")
    .eq("organization_id", event.organization_id)
    .eq("user_id", authData.user.id)
    .eq("status", "active")
    .in("role", ["owner", "admin", "staff", "scanner"])
    .maybeSingle();
  if (membershipError || !membership) return res.status(403).json({ error: "You are not assigned to this event" });

  const { data, error } = await admin.rpc("verify_pass", { p_event_id: eventId, p_signature: signature, p_gatekeeper: authData.user.id });
  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json(data?.[0] || { result: "INVALID", headcount: 0 });
}
