import { useState } from "react";
import type { Role } from "../lib/types";
import { useApp } from "../lib/store";
import { cx, downloadFile, fmtDate, num, relTime } from "../lib/utils";
import { Avatar, Badge, Button, Card, CopyButton, Field, Input, Modal, Select, StatusPill, Textarea, useToast } from "../components/ui";
import { ICheck, IKey, IMail, ISend, IServer, IShield, ITerminal, ITrash, IX, IBox, IAlert } from "../components/icons";

const ROLE_LABEL: Record<Role, string> = { owner: "Owner", admin: "Admin", staff: "Staff", scanner: "Scanner" };

/* ================= Team ================= */

const MATRIX: Array<{ label: string; roles: Record<Role, boolean> }> = [
  { label: "Create & edit events", roles: { owner: true, admin: true, staff: true, scanner: false } },
  { label: "Refund orders", roles: { owner: true, admin: true, staff: false, scanner: false } },
  { label: "Operate door scanner", roles: { owner: true, admin: true, staff: true, scanner: true } },
  { label: "Message attendees", roles: { owner: true, admin: true, staff: true, scanner: false } },
  { label: "Export data & reports", roles: { owner: true, admin: true, staff: true, scanner: false } },
  { label: "Manage team & roles", roles: { owner: true, admin: false, staff: false, scanner: false } },
  { label: "Org settings & keys", roles: { owner: true, admin: true, staff: false, scanner: false } },
];

export function TeamView() {
  const { db, api, user, can } = useApp();
  const toast = useToast();
  const [invite, setInvite] = useState({ name: "", email: "", role: "staff" as Role });
  const manageable = can("team");

  return (
    <div className="mx-auto max-w-[1100px] space-y-5 px-5 pb-16 pt-6 lg:px-8">
      <div>
        <h1 className="font-display text-[28px] font-bold tracking-tight">Team</h1>
        <p className="text-[13.5px] text-mut">Multi-user access with role-based permissions. You're acting as <strong className="text-ink">{user.name}</strong> ({ROLE_LABEL[user.role]}).</p>
      </div>

      {/* act-as switcher */}
      <Card className="p-4">
        <p className="code-pill mb-2.5 text-[11px] uppercase tracking-widest text-faint">Demo — act as</p>
        <div className="flex flex-wrap gap-2">
          {db.users.filter((u) => u.status === "active").map((u) => (
            <button
              key={u.id}
              onClick={() => { api.switchUser(u.id); toast({ kind: "info", title: `Now acting as ${u.name}`, desc: ROLE_LABEL[u.role] + " permissions applied across the app." }); }}
              className={cx(
                "focus-ring flex items-center gap-2.5 rounded-lg border px-3 py-1.5 transition-all",
                u.id === db.currentUserId ? "border-flame bg-flamedim shadow-sm" : "border-line bg-white hover:border-faint",
              )}
            >
              <Avatar name={u.name} color={u.color} size={26} />
              <span className="text-left">
                <span className="block text-[12.5px] font-bold leading-tight">{u.name}</span>
                <span className="block text-[10.5px] text-mut">{ROLE_LABEL[u.role]}</span>
              </span>
              {u.id === db.currentUserId && <ICheck size={13} className="text-flame" />}
            </button>
          ))}
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <Card className="overflow-hidden">
          <div className="border-b border-line px-5 py-3.5">
            <h2 className="font-display text-[16px] font-bold tracking-tight">Members · {db.users.length}</h2>
          </div>
          <div className="divide-y divide-line">
            {db.users.map((u) => (
              <div key={u.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                <Avatar name={u.name} color={u.color} size={36} />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 text-[13.5px] font-bold">{u.name} {u.id === db.currentUserId && <Badge tone="flame">you</Badge>}</p>
                  <p className="truncate text-[12px] text-mut">{u.email}</p>
                </div>
                <StatusPill status={u.status === "invited" ? "invited" : "active"} />
                {manageable && u.id !== db.currentUserId ? (
                  <>
                    <Select className="h-8 w-28 text-[12px]" value={u.role} onChange={(e) => { api.updateMember(u.id, { role: e.target.value as Role }); toast({ kind: "ok", title: `${u.name} is now ${ROLE_LABEL[e.target.value as Role]}` }); }}>
                      {(Object.keys(ROLE_LABEL) as Role[]).filter((r) => r !== "owner" || u.role === "owner").map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                    </Select>
                    {u.status === "invited" ? (
                      <Button size="sm" variant="outline" onClick={() => toast({ kind: "ok", title: "Invite re-sent", desc: u.email })}><ISend size={12} /> Resend</Button>
                    ) : (
                      <Button size="sm" variant="ghost" className="text-bad hover:bg-baddim" onClick={() => { api.removeMember(u.id); toast({ kind: "info", title: `${u.name} removed` }); }}><ITrash size={13} /></Button>
                    )}
                  </>
                ) : (
                  <Badge>{ROLE_LABEL[u.role]}</Badge>
                )}
              </div>
            ))}
          </div>

          {manageable ? (
            <div className="border-t border-dashed border-line2 bg-white/60 p-4">
              <p className="mb-2.5 text-[12px] font-bold uppercase tracking-widest text-faint">Invite a teammate</p>
              <div className="flex flex-wrap gap-2">
                <Input className="h-9 w-44" placeholder="Full name" value={invite.name} onChange={(e) => setInvite({ ...invite, name: e.target.value })} />
                <Input className="h-9 min-w-[200px] flex-1" placeholder="email@venue.com" type="email" value={invite.email} onChange={(e) => setInvite({ ...invite, email: e.target.value })} />
                <Select className="h-9 w-32" value={invite.role} onChange={(e) => setInvite({ ...invite, role: e.target.value as Role })}>
                  {(["admin", "staff", "scanner"] as Role[]).map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                </Select>
                <Button size="sm" className="h-9" disabled={!invite.name.trim() || !/^\S+@\S+\.\S+$/.test(invite.email)} onClick={() => { api.addMember(invite); toast({ kind: "ok", title: "Invite sent", desc: `${invite.email} · ${ROLE_LABEL[invite.role]}` }); setInvite({ name: "", email: "", role: "staff" }); }}>
                  <ISend size={13} /> Invite
                </Button>
              </div>
            </div>
          ) : (
            <p className="border-t border-dashed border-line2 bg-white/60 px-5 py-3 text-[12.5px] text-mut">Only the owner can manage the team.</p>
          )}
        </Card>

        <Card className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <IShield size={16} className="text-teal" />
            <h2 className="font-display text-[16px] font-bold tracking-tight">Permission matrix</h2>
          </div>
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="code-pill text-[10px] uppercase tracking-widest text-faint">
                <th className="pb-2 text-left font-semibold">Capability</th>
                {(["owner", "admin", "staff", "scanner"] as Role[]).map((r) => <th key={r} className="pb-2 text-center font-semibold">{ROLE_LABEL[r].slice(0, 2)}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {MATRIX.map((row) => (
                <tr key={row.label}>
                  <td className="py-2 pr-2 font-medium text-ink2">{row.label}</td>
                  {(["owner", "admin", "staff", "scanner"] as Role[]).map((r) => (
                    <td key={r} className="py-2 text-center">
                      {row.roles[r] ? <ICheck size={14} className="mx-auto text-ok" /> : <IX size={13} className="mx-auto text-line2" />}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}

/* ================= Messages history ================= */

export function MessagesView({ navigate }: { navigate: (to: string) => void }) {
  const { db } = useApp();
  return (
    <div className="mx-auto max-w-[900px] space-y-5 px-5 pb-16 pt-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[28px] font-bold tracking-tight">Messages</h1>
          <p className="text-[13.5px] text-mut">Bulk email history for every event, sent through your own SMTP relay.</p>
        </div>
        <Button onClick={() => navigate("/attendees")}><IMail size={14} /> Compose from attendees</Button>
      </div>
      <div className="space-y-3">
        {db.messages.map((m) => (
          <Card key={m.id} className="p-5" hover>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="teal"><IMail size={11} />{m.eventName}</Badge>
              <Badge>{m.audience}</Badge>
              <span className="ml-auto code-pill text-[11px] text-faint">{relTime(m.at)} · by {m.by}</span>
            </div>
            <p className="mt-2.5 font-display text-[16px] font-bold tracking-tight">{m.subject}</p>
            <p className="mt-1 whitespace-pre-line text-[13px] leading-relaxed text-ink2">{m.body}</p>
            <p className="code-pill mt-3 text-[11.5px] text-mut">{num(m.recipients)} recipients · delivered via {db.settings.smtpHost}</p>
          </Card>
        ))}
        {db.messages.length === 0 && <Card className="p-10 text-center text-[13.5px] text-mut">No messages sent yet.</Card>}
      </div>
    </div>
  );
}

/* ================= API ================= */

const ENDPOINTS: Array<{ method: "GET" | "POST"; path: string; desc: string; curl?: string }> = [
  { method: "GET", path: "/api/v1/events", desc: "List events with live ticket availability.", curl: `curl https://tickets.example.com/api/v1/events \\\n  -H "Authorization: Bearer $STUBHAUS_KEY"` },
  { method: "GET", path: "/api/v1/events/:slug", desc: "Single event — tiers, add-ons, promos and remaining capacity." },
  { method: "POST", path: "/api/v1/orders", desc: "Create an order with tickets, add-ons and a promo code. Returns a payment intent for Stripe or marks free orders confirmed.", curl: `curl -X POST https://tickets.example.com/api/v1/orders \\\n  -H "Authorization: Bearer $STUBHAUS_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "event": "northloop-dev-summit-26",\n    "items": [{ "ticket": "t-sum-std", "qty": 2 }],\n    "promo": "EARLYBIRD",\n    "buyer": { "name": "Ada Lovelace", "email": "ada@ex.com" }\n  }'` },
  { method: "GET", path: "/api/v1/orders/:number", desc: "Order status, totals and its attendees with QR codes." },
  { method: "POST", path: "/api/v1/orders/:number/refund", desc: "Refund in full. Idempotent — safe to retry from webhooks." },
  { method: "GET", path: "/api/v1/events/:slug/attendees", desc: "Cursor-paginated attendees, including custom question answers." },
  { method: "POST", path: "/api/v1/checkin", desc: "Scan a ticket code from your own hardware. Returns ok, duplicate, invalid or refunded.", curl: `curl -X POST https://tickets.example.com/api/v1/checkin \\\n  -H "Authorization: Bearer $STUBHAUS_KEY" \\\n  -d '{ "event": "maya-reine-neon-coast", "code": "K7QX2M4B", "gate": "Gate 1" }'` },
  { method: "GET", path: "/api/v1/reports/summary?days=30", desc: "Gross, net, fees, tax and tickets sold per day and per event." },
  { method: "POST", path: "/api/v1/messages", desc: "Send a bulk message to an audience (all, checked-in, tier)." },
];

export function ApiPage() {
  const { db, api, can } = useApp();
  const toast = useToast();
  const [label, setLabel] = useState("");
  const [reveal, setReveal] = useState<Record<string, boolean>>({});

  return (
    <div className="mx-auto max-w-[1100px] space-y-5 px-5 pb-16 pt-6 lg:px-8">
      <div>
        <h1 className="font-display text-[28px] font-bold tracking-tight">API</h1>
        <p className="text-[13.5px] text-mut">A small, boring REST API for integrations — your website, door hardware, Zapier, anything with HTTP.</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-5">
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-[16px] font-bold tracking-tight">Base URL</h2>
              <Badge tone="teal">v1 · stable</Badge>
            </div>
            <div className="code-pill mt-3 rounded-lg bg-night px-4 py-3 text-[12.5px] text-[#7fd6a4]">https://{db.settings.domain.replace(/^https?:\/\//, "")}/api/v1</div>
            <p className="mt-2.5 text-[12px] text-mut">Authenticate with a bearer key. All responses are JSON, errors follow RFC 7807.</p>
          </Card>

          <Card className="p-5">
            <h2 className="mb-3 font-display text-[16px] font-bold tracking-tight">Keys</h2>
            <div className="space-y-2.5">
              {db.apiKeys.map((k) => (
                <div key={k.id} className="flex items-center gap-3 rounded-lg border border-line bg-white px-3.5 py-2.5">
                  <IKey size={15} className="shrink-0 text-flame" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-bold">{k.label}</p>
                    <p className="code-pill truncate text-[11.5px] text-mut">
                      {reveal[k.id] ? k.key : `${k.key.slice(0, 12)}••••••••••••••••`}
                      <button className="ml-2 font-sans font-semibold text-teal hover:underline" onClick={() => setReveal({ ...reveal, [k.id]: !reveal[k.id] })}>{reveal[k.id] ? "hide" : "show"}</button>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] text-faint">created {fmtDate(k.createdAt)}</p>
                    {k.lastUsed && <p className="text-[11px] text-faint">used {relTime(k.lastUsed)}</p>}
                  </div>
                  <CopyMini text={k.key} />
                  {can("settings") && (
                    <button className="focus-ring rounded-md p-1.5 text-mut transition-colors hover:bg-baddim hover:text-bad" onClick={() => { api.revokeApiKey(k.id); toast({ kind: "info", title: "Key revoked" }); }}><ITrash size={14} /></button>
                  )}
                </div>
              ))}
              {db.apiKeys.length === 0 && <p className="text-[13px] text-mut">No keys yet — create one to start integrating.</p>}
            </div>
            {can("settings") && (
              <div className="mt-4 flex gap-2">
                <Input className="h-9 flex-1" placeholder="Key label, e.g. Door hardware" value={label} onChange={(e) => setLabel(e.target.value)} />
                <Button size="sm" className="h-9" disabled={!label.trim()} onClick={() => { const k = api.addApiKey(label.trim()); setLabel(""); toast({ kind: "ok", title: "Key created", desc: "Copy it now — it's shown in full once." }); void k; }}><IKey size={13} /> Create key</Button>
              </div>
            )}
          </Card>
        </div>

        <Card className="overflow-hidden">
          <div className="border-b border-line px-5 py-3.5">
            <h2 className="font-display text-[16px] font-bold tracking-tight">Endpoints</h2>
          </div>
          <div className="divide-y divide-line">
            {ENDPOINTS.map((e) => (
              <EndpointRow key={e.method + e.path} e={e} />
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function CopyMini({ text }: { text: string }) {
  const [ok, setOk] = useState(false);
  return (
    <span
      role="button"
      tabIndex={0}
      className="text-[11px] font-bold text-teal hover:underline"
      onClick={async (ev) => { ev.stopPropagation(); try { await navigator.clipboard.writeText(text); } catch { /* noop */ } setOk(true); setTimeout(() => setOk(false), 1200); }}
    >
      {ok ? "copied" : "copy"}
    </span>
  );
}

function EndpointRow({ e }: { e: (typeof ENDPOINTS)[number] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="px-5 py-3">
      <button className="focus-ring flex w-full items-center gap-2.5 text-left" onClick={() => e.curl && setOpen(!open)}>
        <span className={cx("code-pill w-14 shrink-0 rounded px-1.5 py-0.5 text-center text-[10.5px] font-bold", e.method === "GET" ? "bg-tealdim text-teal" : "bg-flamedim text-flame")}>{e.method}</span>
        <span className="code-pill text-[12.5px] font-semibold">{e.path}</span>
        {e.curl && <span className="ml-auto text-[11px] font-semibold text-faint">{open ? "hide example" : "example"}</span>}
      </button>
      <p className="mt-1 pl-[70px] text-[12.5px] leading-relaxed text-mut">{e.desc}</p>
      {open && e.curl && (
        <div className="pop-in mt-2.5 pl-[70px]">
          <pre className="code-pill overflow-x-auto rounded-lg bg-night p-3.5 text-[11px] leading-relaxed text-[#c8cec6]">{e.curl}</pre>
          <div className="mt-2"><CopyButton text={e.curl} small label="Copy cURL" /></div>
        </div>
      )}
    </div>
  );
}

/* ================= Self-host ================= */

const COMPOSE_YML = `services:
  stubhaus:
    image: ghcr.io/stubhaus/stubhaus:latest
    restart: unless-stopped
    ports:
      - "8080:8080"
    environment:
      DATABASE_URL: postgres://stubhaus:\${DB_PASSWORD}@db:5432/stubhaus
      REDIS_URL: redis://cache:6379
      PUBLIC_URL: \${PUBLIC_URL}
      SMTP_HOST: \${SMTP_HOST}
      SMTP_USER: \${SMTP_USER}
      SMTP_PASS: \${SMTP_PASS}
      STRIPE_SECRET_KEY: \${STRIPE_SECRET_KEY}
      STRIPE_WEBHOOK_SECRET: \${STRIPE_WEBHOOK_SECRET}
      SESSION_SECRET: \${SESSION_SECRET}
    depends_on:
      db:
        condition: service_healthy
    volumes:
      - uploads:/data/uploads

  db:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: stubhaus
      POSTGRES_PASSWORD: \${DB_PASSWORD}
      POSTGRES_DB: stubhaus
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U stubhaus"]
      interval: 5s
      retries: 10
    volumes:
      - pgdata:/var/lib/postgresql/data

  cache:
    image: redis:7-alpine
    restart: unless-stopped

volumes:
  pgdata:
  uploads:`;

const ENV_FILE = `# --- required ---
DB_PASSWORD=change-me-to-something-long
PUBLIC_URL=https://tickets.example.com
SESSION_SECRET=generate-64-random-chars

# --- email (ticket delivery + attendee messages) ---
SMTP_HOST=smtp.example.com
SMTP_USER=tickets@example.com
SMTP_PASS=

# --- payments (omit both to run free-events-only) ---
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=`;

const COMMANDS = `mkdir stubhaus && cd stubhaus
curl -O https://get.stubhaus.dev/docker-compose.yml
curl -o .env https://get.stubhaus.dev/.env.example
# edit .env with your secrets, then:
docker compose up -d
docker compose exec stubhaus stubhaus migrate`;

export function SelfHostView() {
  const toast = useToast();
  return (
    <div className="mx-auto max-w-[1100px] space-y-5 px-5 pb-16 pt-6 lg:px-8">
      <div>
        <h1 className="font-display text-[28px] font-bold tracking-tight">Self-hosting</h1>
        <p className="max-w-2xl text-[13.5px] text-mut">Stubhaus is one Docker image plus Postgres and Redis. Your data stays on your machine — this demo runs the same flows entirely in your browser.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { n: "01", t: "Grab the files", d: "docker-compose.yml + .env below, or curl them." },
          { n: "02", t: "docker compose up", d: "Postgres, Redis and the app start healthy-checked." },
          { n: "03", t: "Point a domain", d: "Caddy/Traefik in front for automatic HTTPS." },
        ].map((s) => (
          <Card key={s.n} className="p-4">
            <span className="code-pill text-[11px] font-bold text-flame">{s.n}</span>
            <p className="mt-1.5 text-[14px] font-bold">{s.t}</p>
            <p className="mt-0.5 text-[12.5px] text-mut">{s.d}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-5">
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-line px-5 py-3">
              <div className="flex items-center gap-2"><IServer size={15} className="text-flame" /><h2 className="font-display text-[15px] font-bold tracking-tight">docker-compose.yml</h2></div>
              <div className="flex gap-2">
                <CopyButton text={COMPOSE_YML} small />
                <Button size="sm" variant="outline" onClick={() => { downloadFile("docker-compose.yml", COMPOSE_YML, "text/yaml"); toast({ kind: "ok", title: "docker-compose.yml downloaded" }); }}>Download</Button>
              </div>
            </div>
            <pre className="code-pill max-h-[420px] overflow-auto bg-night p-4 text-[11.5px] leading-relaxed text-[#c8cec6]">{COMPOSE_YML}</pre>
          </Card>

          <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-line px-5 py-3">
              <div className="flex items-center gap-2"><IBox size={15} className="text-teal" /><h2 className="font-display text-[15px] font-bold tracking-tight">.env</h2></div>
              <div className="flex gap-2">
                <CopyButton text={ENV_FILE} small />
                <Button size="sm" variant="outline" onClick={() => { downloadFile(".env", ENV_FILE, "text/plain"); toast({ kind: "ok", title: ".env downloaded" }); }}>Download</Button>
              </div>
            </div>
            <pre className="code-pill overflow-auto bg-night p-4 text-[11.5px] leading-relaxed text-[#c8cec6]">{ENV_FILE}</pre>
          </Card>
        </div>

        <div className="space-y-5">
          <Card className="overflow-hidden">
            <div className="flex items-center gap-2 border-b border-line px-5 py-3"><ITerminal size={15} className="text-flame" /><h2 className="font-display text-[15px] font-bold tracking-tight">Commands</h2></div>
            <pre className="code-pill overflow-auto bg-night p-4 text-[11.5px] leading-relaxed text-[#7fd6a4]">{COMMANDS}</pre>
            <div className="border-t border-line px-5 py-3"><CopyButton text={COMMANDS} small label="Copy commands" /></div>
          </Card>

          <Card className="p-5">
            <h3 className="font-display text-[15px] font-bold tracking-tight">Operational notes</h3>
            <ul className="mt-3 space-y-2.5 text-[12.5px] leading-relaxed text-ink2">
              <li className="flex gap-2"><ICheck size={14} className="mt-0.5 shrink-0 text-ok" />Backups: <span className="code-pill text-[11.5px]">docker compose exec db pg_dump -U stubhaus stubhaus &gt; backup.sql</span> — cron it nightly.</li>
              <li className="flex gap-2"><ICheck size={14} className="mt-0.5 shrink-0 text-ok" />Upgrades: <span className="code-pill text-[11.5px]">docker compose pull &amp;&amp; docker compose up -d</span>, migrations run automatically.</li>
              <li className="flex gap-2"><ICheck size={14} className="mt-0.5 shrink-0 text-ok" />HTTPS: put Caddy in front — one <span className="code-pill text-[11.5px]">reverse_proxy localhost:8080</span> line and certs are automatic.</li>
              <li className="flex gap-2"><IAlert size={14} className="mt-0.5 shrink-0 text-warn" />Leaving Stripe keys empty runs Stubhaus in free-tickets mode — handy for community events.</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ================= Settings ================= */

export function SettingsView() {
  const { db, api, can } = useApp();
  const toast = useToast();
  const [form, setForm] = useState(db.settings);
  const [confirmReset, setConfirmReset] = useState(false);
  const editable = can("settings");

  return (
    <div className="mx-auto max-w-[900px] space-y-5 px-5 pb-16 pt-6 lg:px-8">
      <div>
        <h1 className="font-display text-[28px] font-bold tracking-tight">Settings</h1>
        <p className="text-[13.5px] text-mut">Organization, money and delivery — applied to every event.</p>
      </div>

      {!editable && (
        <div className="flex items-center gap-2.5 rounded-lg border border-warn/30 bg-warndim px-4 py-2.5 text-[13px] font-medium text-warn">
          <IAlert size={15} /> Your role can view settings but not change them.
        </div>
      )}

      <div className={cx(!editable && "pointer-events-none opacity-70")}>
        <div className="grid gap-5 lg:grid-cols-2">
          <Card className="space-y-4 p-5">
            <h2 className="font-display text-[16px] font-bold tracking-tight">Organization</h2>
            <Field label="Organization name"><Input value={form.org} onChange={(e) => setForm({ ...form, org: e.target.value })} /></Field>
            <Field label="Ticketing domain" hint="used for pages, widget & API"><Input value={form.domain} onChange={(e) => setForm({ ...form, domain: e.target.value })} /></Field>
            <Field label="Support email" hint="appears on receipts"><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
          </Card>

          <Card className="space-y-4 p-5">
            <h2 className="font-display text-[16px] font-bold tracking-tight">Money</h2>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Currency">
                <Select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
                  {["USD", "EUR", "GBP", "CAD", "AUD"].map((c) => <option key={c} value={c}>{c}</option>)}
                </Select>
              </Field>
              <Field label="Tax rate %" hint="on tickets + fees"><Input type="number" step="0.05" min={0} value={form.taxRate} onChange={(e) => setForm({ ...form, taxRate: Math.max(0, Number(e.target.value)) })} /></Field>
              <Field label="Service fee %"><Input type="number" step="0.1" min={0} value={form.feePercent} onChange={(e) => setForm({ ...form, feePercent: Math.max(0, Number(e.target.value)) })} /></Field>
              <Field label="Fixed fee / ticket"><Input type="number" step="0.05" min={0} value={form.feeFixed} onChange={(e) => setForm({ ...form, feeFixed: Math.max(0, Number(e.target.value)) })} /></Field>
            </div>
            <p className="rounded-lg border border-line bg-white px-3.5 py-2.5 text-[12px] text-mut">Fees are itemized at checkout; tax is calculated on tickets + fees, remitted by you.</p>
          </Card>

          <Card className="space-y-4 p-5">
            <h2 className="font-display text-[16px] font-bold tracking-tight">Email delivery</h2>
            <Field label="SMTP host"><Input value={form.smtpHost} onChange={(e) => setForm({ ...form, smtpHost: e.target.value })} /></Field>
            <p className="text-[12.5px] leading-relaxed text-mut">Stubhaus sends PDF tickets, receipts and attendee messages through your own relay — no third-party sender, no per-email fees.</p>
          </Card>

          <Card className="flex flex-col justify-between border-bad/25 p-5">
            <div>
              <h2 className="font-display text-[16px] font-bold text-bad">Demo data</h2>
              <p className="mt-1 text-[12.5px] leading-relaxed text-mut">This workspace is seeded with a full season of events, orders and scans. Reset to start from a clean slate.</p>
            </div>
            <Button variant="danger" size="sm" className="mt-4 self-start" onClick={() => setConfirmReset(true)}><ITrash size={13} /> Reset demo data</Button>
          </Card>
        </div>

        <div className="mt-5 flex justify-end">
          <Button size="lg" onClick={() => { api.saveSettings(form); toast({ kind: "ok", title: "Settings saved", desc: "New fees & tax apply to future orders." }); }}>Save settings</Button>
        </div>
      </div>

      <Modal open={confirmReset} onClose={() => setConfirmReset(false)} title="Reset all demo data?">
        <p className="text-[13.5px] leading-relaxed text-ink2">Events, orders, attendees, scan logs, keys and settings will be re-seeded. This can't be undone.</p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirmReset(false)}>Cancel</Button>
          <Button variant="danger" onClick={() => api.resetDemo()}><ITrash size={14} /> Reset everything</Button>
        </div>
      </Modal>
    </div>
  );
}
