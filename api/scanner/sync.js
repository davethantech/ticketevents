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

  const scans = Array.isArray(req.body?.scans) ? req.body.scans.slice(0, 250) : [];
  const results = [];
  for (const scan of scans) {
    const { event_id: eventId, signature } = scan || {};
    if (!eventId || !signature) { results.push({ result: "INVALID", signature }); continue; }
    const { data: event } = await admin.from("events").select("organization_id").eq("id", eventId).maybeSingle();
    if (!event) { results.push({ result: "INVALID", signature }); continue; }
    const { data: membership } = await admin.from("organization_members").select("role").eq("organization_id", event.organization_id).eq("user_id", authData.user.id).eq("status", "active").in("role", ["owner","admin","staff","scanner"]).maybeSingle();
    if (!membership) { results.push({ result: "FORBIDDEN", signature }); continue; }
    const { data, error } = await admin.rpc("verify_pass", { p_event_id: eventId, p_signature: signature, p_gatekeeper: authData.user.id });
    results.push(error ? { result: "ERROR", signature, error: error.message } : { signature, ...(data?.[0] || { result: "INVALID" }) });
  }
  return res.status(200).json({ synced: results.length, results });
}
