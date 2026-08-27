export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const version = process.env.WHATSAPP_GRAPH_VERSION || "v23.0";
  if (!token || !phoneNumberId) return res.status(500).json({ error: "WhatsApp Business credentials are not configured" });
  const { to, template, language = "en_US", parameters = [] } = req.body || {};
  if (!to || !template) return res.status(400).json({ error: "to and template are required" });

  const response = await fetch(`https://graph.facebook.com/${version}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", to, type: "template", template: { name: template, language: { code: language }, components: [{ type: "body", parameters: parameters.map((text) => ({ type: "text", text: String(text) })) }] } }),
  });
  const body = await response.json();
  return res.status(response.ok ? 200 : response.status).json(body);
}
