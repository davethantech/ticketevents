import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
});

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) return res.status(500).json({ error: "PAYSTACK_SECRET_KEY is not configured" });

  const raw = typeof req.body === "string" ? req.body : JSON.stringify(req.body ?? {});
  const expected = crypto.createHmac("sha512", secret).update(raw).digest("hex");
  const supplied = req.headers["x-paystack-signature"];
  if (!supplied || !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(String(supplied)))) {
    return res.status(401).json({ error: "Invalid webhook signature" });
  }

  const event = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  if (event?.event !== "charge.success") return res.status(200).json({ received: true });

  const payment = event.data || {};
  const metadata = payment.metadata || {};
  const eventId = metadata.event_id;
  const tierId = metadata.tier_id;
  const quantity = Math.max(1, Number(metadata.quantity || 1));
  const reference = payment.reference;
  if (!eventId || !tierId || !reference) return res.status(400).json({ error: "Missing event, tier or payment reference" });

  const existing = await supabase.from("orders").select("id,status").eq("payment_reference", reference).maybeSingle();
  if (existing.data) return res.status(200).json({ received: true, duplicate: true });

  const { data: tier, error: tierError } = await supabase.from("ticket_types").select("id,name,price,capacity,sold,event_id").eq("id", tierId).eq("event_id", eventId).single();
  if (tierError || !tier) return res.status(400).json({ error: "Ticket tier not found" });
  if (tier.sold + quantity > tier.capacity) return res.status(409).json({ error: "Event capacity exceeded" });

  const amount = Number(payment.amount || 0) / 100;
  const buyer = { name: payment.customer?.first_name ? `${payment.customer.first_name} ${payment.customer.last_name || ""}`.trim() : payment.customer?.email || "Guest", email: payment.customer?.email || "", phone: payment.customer?.phone || "" };
  const orderNumber = `ENT-${reference}`;
  const { data: order, error: orderError } = await supabase.from("orders").insert({
    event_id: eventId, order_number: orderNumber, payment_reference: reference, buyer,
    items: [{ ticketId: tier.id, name: tier.name, qty: quantity, unit: tier.price }],
    subtotal: amount, discount: 0, fees: 0, tax: 0, total: amount, status: "paid", method: "card",
  }).select("id").single();
  if (orderError) return res.status(500).json({ error: orderError.message });

  const signature = crypto.createHash("sha256").update(`${order.id}:${eventId}:${reference}:${crypto.randomBytes(24).toString("hex")}`).digest("hex");
  const { error: passError } = await supabase.from("passes").insert({ event_id: eventId, order_id: order.id, signature, headcount: quantity, status: "ACTIVE" });
  if (passError) return res.status(500).json({ error: passError.message });

  const { error: soldError } = await supabase.from("ticket_types").update({ sold: tier.sold + quantity }).eq("id", tier.id).eq("event_id", eventId);
  if (soldError) return res.status(500).json({ error: soldError.message });

  return res.status(200).json({ received: true, order_id: order.id });
}
