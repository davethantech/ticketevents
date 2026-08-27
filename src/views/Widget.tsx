import { useState } from "react";
import { TYPE_LABEL, useApp } from "../lib/store";
import { Badge, Button, Card, CopyButton, Field, Select, useToast } from "../components/ui";
import { ICheck, IGlobe, ITerminal, IWifi } from "../components/icons";

export default function WidgetSetup() {
  const { db } = useApp();
  const toast = useToast();
  const publishable = db.events.filter((e) => e.status !== "draft");
  const [eventId, setEventId] = useState(publishable[0]?.id ?? "");
  const ev = db.events.find((e) => e.id === eventId);
  const domain = db.settings.domain.replace(/^https?:\/\//, "");
  const slug = ev?.slug ?? "your-event";

  const iframeSnippet = `<iframe\n  src="https://${domain}/#/embed/${slug}"\n  style="width:100%;height:660px;border:0;border-radius:16px;overflow:hidden"\n  title="Tickets — ${ev?.name ?? ""}"\n></iframe>`;

  const scriptSnippet = `<!-- Stubhaus ticket widget -->\n<script\n  async\n  src="https://${domain}/widget.js"\n  data-event="${slug}"\n  data-theme="auto"\n></script>`;

  const features = [
    { icon: <IGlobe size={15} />, title: "Branded to the event", desc: "Picks up the event's accent color, cover and checkout settings automatically." },
    { icon: <IWifi size={15} />, title: "Works on any stack", desc: "Plain HTML, React, WordPress, Webflow — one iframe or one script tag." },
    { icon: <ICheck size={15} />, title: "Full checkout inside", desc: "Tier selection, add-ons, promo codes and PDF tickets, without leaving your site." },
  ];

  return (
    <div className="mx-auto max-w-[1200px] space-y-5 px-5 pb-16 pt-6 lg:px-8">
      <div>
        <h1 className="font-display text-[28px] font-bold tracking-tight">Embeddable ticket widget</h1>
        <p className="max-w-2xl text-[13.5px] text-mut">Drop a live checkout box onto any website. Sales land in the same orders, attendees and reports as your hosted page.</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {features.map((f, i) => (
          <Card key={f.title} className="p-4" hover>
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-tealdim text-teal">{f.icon}</span>
              <p className="text-[13.5px] font-bold">{f.title}</p>
            </div>
            <p className="mt-2 text-[12.5px] leading-relaxed text-mut">{f.desc}</p>
            <span className="code-pill mt-2 block text-[10.5px] text-faint">0{i + 1}</span>
          </Card>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_1.1fr]">
        <div className="space-y-5">
          <Card className="space-y-4 p-5">
            <Field label="Widget event">
              <Select value={eventId} onChange={(e) => setEventId(e.target.value)}>
                {publishable.map((e) => <option key={e.id} value={e.id}>{e.name} ({TYPE_LABEL[e.type]})</option>)}
              </Select>
            </Field>
            {!ev && <p className="text-[13px] text-warn">Publish an event first — drafts can't be embedded.</p>}
            <div className="flex items-center gap-2">
              <Badge tone="ok">● Live preview</Badge>
              <span className="text-[12px] text-mut">renders exactly what visitors see</span>
            </div>
          </Card>

          <Card className="p-5">
            <div className="mb-2 flex items-center gap-2">
              <ITerminal size={15} className="text-flame" />
              <h3 className="font-display text-[15px] font-bold tracking-tight">Option A — iframe</h3>
            </div>
            <pre className="code-pill overflow-x-auto rounded-lg bg-night p-4 text-[11.5px] leading-relaxed text-[#c8cec6]">{iframeSnippet}</pre>
            <div className="mt-3"><CopyButton text={iframeSnippet} label="Copy iframe snippet" /></div>
          </Card>

          <Card className="p-5">
            <div className="mb-2 flex items-center gap-2">
              <ITerminal size={15} className="text-teal" />
              <h3 className="font-display text-[15px] font-bold tracking-tight">Option B — script tag</h3>
            </div>
            <pre className="code-pill overflow-x-auto rounded-lg bg-night p-4 text-[11.5px] leading-relaxed text-[#c8cec6]">{scriptSnippet}</pre>
            <div className="mt-3 flex items-center gap-3">
              <CopyButton text={scriptSnippet} label="Copy script tag" />
              <Button variant="ghost" size="sm" onClick={() => toast({ kind: "info", title: "widget.js", desc: "Served by your Stubhaus instance at /widget.js — it injects a styled iframe automatically." })}>How it works</Button>
            </div>
          </Card>
        </div>

        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-line bg-white/70 px-4 py-2.5">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-bad/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-warn/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-ok/70" />
            </div>
            <span className="code-pill truncate text-[11px] text-mut">yourwebsite.com — ticket box</span>
          </div>
          <div className="stripe-hatch bg-bg p-4">
            {ev ? (
              <iframe
                title="Ticket widget preview"
                src={`${window.location.pathname}#/embed/${ev.slug}`}
                className="h-[680px] w-full rounded-xl border border-line bg-paper shadow-[var(--shadow-lift)]"
              />
            ) : (
              <div className="flex h-[680px] items-center justify-center text-[13px] text-mut">Publish an event to preview the widget.</div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
