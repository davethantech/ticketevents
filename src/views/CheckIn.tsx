import { useMemo, useRef, useState } from "react";
import type { ScanEntry } from "../lib/types";
import { eventCheckedIn, eventSold, useApp } from "../lib/store";
import { cx, downloadFile, fmtTime, num, relTime, toCSV } from "../lib/utils";
import { Badge, Button, Card, Segmented, Select, useToast } from "../components/ui";
import { IDownload, IQr, IScan, IUndo, IUsers } from "../components/icons";

const RESULT_META: Record<ScanEntry["result"], { label: string; cls: string; ring: string }> = {
  ok: { label: "Checked in", cls: "border-ok/40 bg-okdim text-ok", ring: "bg-ok" },
  duplicate: { label: "Already in", cls: "border-warn/40 bg-warndim text-warn", ring: "bg-warn" },
  invalid: { label: "Invalid code", cls: "border-bad/40 bg-baddim text-bad", ring: "bg-bad" },
  refunded: { label: "Refunded", cls: "border-bad/40 bg-baddim text-bad", ring: "bg-bad" },
  reversed: { label: "Re-opened", cls: "border-teal/40 bg-tealdim text-teal", ring: "bg-teal" },
};

export default function CheckIn({ initialEventId }: { initialEventId?: string }) {
  const { db, api, user, can } = useApp();
  const toast = useToast();
  const sellable = db.events.filter((e) => e.status !== "draft");
  const [eventId, setEventId] = useState(initialEventId && sellable.some((e) => e.id === initialEventId) ? initialEventId : sellable.find((e) => e.status === "live")?.id ?? sellable[0]?.id ?? "");
  const [code, setCode] = useState("");
  const [last, setLast] = useState<ScanEntry | null>(null);
  const [logFilter, setLogFilter] = useState<"all" | ScanEntry["result"]>("all");
  const inputRef = useRef<HTMLInputElement>(null);

  const ev = db.events.find((e) => e.id === eventId);
  const expected = ev ? eventSold(ev) : 0;
  const inside = ev ? eventCheckedIn(db.attendees, ev.id) : 0;
  const pct = expected ? Math.round((inside / expected) * 100) : 0;

  const log = useMemo(() => db.scans.filter((s) => s.eventId === eventId && (logFilter === "all" || s.result === logFilter)), [db.scans, eventId, logFilter]);

  const doScan = (raw: string) => {
    if (!ev || !raw.trim()) return;
    const entry = api.checkIn(ev.id, raw, `${user.name}`);
    setLast(entry);
    setCode("");
    inputRef.current?.focus();
    if (entry.result === "ok") toast({ kind: "ok", title: entry.attendee ?? "Checked in", desc: entry.code });
    else if (entry.result === "duplicate") toast({ kind: "info", title: "Already checked in", desc: entry.attendee });
    else if (entry.result === "invalid") toast({ kind: "bad", title: "Unknown code", desc: entry.code });
    else toast({ kind: "bad", title: "Ticket refunded", desc: entry.attendee });
  };

  const simulate = () => {
    if (!ev) return;
    const pool = db.attendees.filter((a) => a.eventId === ev.id && !a.refunded);
    const unchecked = pool.filter((a) => !a.checkedInAt);
    const target = unchecked.length > 0 && Math.random() < 0.85 ? unchecked[Math.floor(Math.random() * unchecked.length)] : pool[Math.floor(Math.random() * pool.length)];
    if (target) doScan(target.code);
  };

  if (!ev) {
    return (
      <div className="mx-auto max-w-[800px] px-5 pt-16 text-center">
        <p className="font-display text-[22px] font-bold">No events to check in yet</p>
        <p className="mt-2 text-[13.5px] text-mut">Publish an event and sell at least one ticket to open the door scanner.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1200px] space-y-5 px-5 pb-16 pt-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[28px] font-bold tracking-tight">Check-in</h1>
          <p className="text-[13.5px] text-mut">Scan QR codes at the door — duplicates and refunds are flagged instantly.</p>
        </div>
        <Select className="w-64" value={eventId} onChange={(e) => { setEventId(e.target.value); setLast(null); }}>
          {sellable.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
        </Select>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.25fr_1fr]">
        {/* scanner */}
        <div className="space-y-5">
          <Card className="overflow-hidden">
            <div className="relative bg-night p-6 text-[#f0f2ee]">
              <div className="stripe-hatch-dark pointer-events-none absolute inset-0" />
              <div className="relative flex items-center justify-between">
                <div>
                  <p className="code-pill text-[11px] uppercase tracking-widest text-[#8d968e]">{ev.venue}</p>
                  <h2 className="font-display text-[20px] font-bold tracking-tight">{ev.name}</h2>
                </div>
                <span className="relative flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ok opacity-60" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-ok" />
                </span>
              </div>

              {/* viewfinder */}
              <div className="relative mx-auto mt-5 h-44 w-44 overflow-hidden rounded-2xl border-2 border-night3 bg-night2">
                <IQr size={90} className="absolute inset-0 m-auto text-night3" />
                <div className="scan-laser absolute inset-x-3 h-0.5 rounded-full" style={{ background: "linear-gradient(to right, transparent, var(--color-flame2), transparent)", boxShadow: "0 0 14px var(--color-flame)" }} />
                {["top-2 left-2 border-t-2 border-l-2", "top-2 right-2 border-t-2 border-r-2", "bottom-2 left-2 border-b-2 border-l-2", "bottom-2 right-2 border-b-2 border-r-2"].map((c) => (
                  <span key={c} className={cx("absolute h-5 w-5 rounded-[3px] border-flame2", c)} />
                ))}
              </div>

              <div className="relative mt-5 flex gap-2">
                <input
                  ref={inputRef}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && doScan(code)}
                  placeholder="Type or paste ticket code…"
                  className="focus-ring code-pill h-11 flex-1 rounded-lg border border-nightline bg-night2 px-3.5 text-[14px] uppercase tracking-widest text-white placeholder:normal-case placeholder:tracking-normal placeholder:text-[#5f6a62]"
                />
                <Button className="h-11" onClick={() => doScan(code)} disabled={!code.trim() || !can("checkin")}><IScan size={15} /> Scan</Button>
                <Button variant="outline" className="h-11 border-nightline bg-night2 text-[#e7eae4] hover:bg-night3" onClick={simulate} title="Simulate a guest arriving at the door">Simulate</Button>
              </div>
              {!can("checkin") && <p className="relative mt-2 text-[12px] text-warn">Your role can't operate the scanner.</p>}
            </div>

            {/* last scan result */}
            <div className={cx("flex items-center gap-4 border-t-4 px-5 py-4 transition-colors", last ? (last.result === "ok" ? "border-ok bg-okdim" : last.result === "duplicate" || last.result === "reversed" ? "border-warn bg-warndim" : "border-bad bg-baddim") : "border-line bg-white")}>
              {last ? (
                <div key={last.id} className="pop-in flex w-full items-center gap-4">
                  <span className={cx("flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white", RESULT_META[last.result].ring)}>
                    <IQr size={20} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={cx("text-[15px] font-bold", last.result === "ok" ? "text-ok" : last.result === "duplicate" || last.result === "reversed" ? "text-warn" : "text-bad")}>
                      {last.attendee ?? "Unknown ticket"} — {RESULT_META[last.result].label}
                    </p>
                    <p className="code-pill text-[11.5px] text-ink2">{last.code} · {fmtTime(last.at)}</p>
                  </div>
                  <Badge tone={last.result === "ok" ? "ok" : last.result === "invalid" || last.result === "refunded" ? "bad" : "warn"}>{RESULT_META[last.result].label}</Badge>
                </div>
              ) : (
                <p className="py-1 text-[13px] text-faint">No scans yet this session. Fire the scanner — results land here instantly.</p>
              )}
            </div>
          </Card>

          {/* progress */}
          <Card className="flex items-center gap-6 p-5">
            <DoorDial pct={pct} />
            <div className="flex-1">
              <p className="font-display text-[19px] font-bold tracking-tight">{num(inside)} <span className="text-[14px] font-semibold text-mut">of {num(expected)} through the door</span></p>
              <div className="mt-2.5 h-2.5 overflow-hidden rounded-full bg-ink/[0.08]">
                <div className="h-full rounded-full bg-teal transition-all duration-700 ease-out" style={{ width: `${pct}%` }} />
              </div>
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[12px] text-mut">
                <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-ok" />{num(inside)} inside</span>
                <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-warn" />{num(Math.max(0, expected - inside))} expected</span>
                <span className="inline-flex items-center gap-1.5"><IUsers size={12} />{num(db.attendees.filter((a) => a.eventId === ev.id && a.refunded).length)} refunded</span>
              </div>
            </div>
          </Card>
        </div>

        {/* log */}
        <Card className="flex h-full flex-col overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
            <h3 className="font-display text-[16px] font-bold tracking-tight">Scan log</h3>
            <div className="flex items-center gap-2">
              <Segmented options={[{ value: "all", label: "All" }, { value: "ok", label: "In" }, { value: "duplicate", label: "Dupes" }, { value: "invalid", label: "Bad" }]} value={logFilter} onChange={(v) => setLogFilter(v)} />
              <Button
                size="sm" variant="outline"
                onClick={() => {
                  const rows: Array<Array<string | number>> = [["Time", "Code", "Attendee", "Result", "By"]];
                  for (const s of log) rows.push([new Date(s.at).toISOString(), s.code, s.attendee ?? "", s.result, s.by]);
                  downloadFile(`stubhaus-scanlog-${ev.slug}.csv`, toCSV(rows));
                  toast({ kind: "ok", title: "Scan log exported" });
                }}
              >
                <IDownload size={13} />
              </Button>
            </div>
          </div>
          <div className="max-h-[560px] flex-1 divide-y divide-line overflow-y-auto">
            {log.length === 0 && <p className="px-5 py-10 text-center text-[13px] text-faint">Nothing logged yet.</p>}
            {log.slice(0, 80).map((s) => (
              <div key={s.id} className={cx("flex items-center gap-3 px-4 py-2.5", s.result === "ok" && "flash-ok")}>
                <span className={cx("h-2 w-2 shrink-0 rounded-full", RESULT_META[s.result].ring)} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold">{s.attendee ?? "Unknown ticket"}</p>
                  <p className="code-pill text-[10.5px] text-faint">{s.code} · {s.by}</p>
                </div>
                <span className={cx("rounded-full border px-2 py-0.5 text-[10.5px] font-bold", RESULT_META[s.result].cls)}>{RESULT_META[s.result].label}</span>
                <span className="code-pill w-14 text-right text-[11px] text-mut">{relTime(s.at)}</span>
                {s.result === "ok" && can("checkin") && (
                  <button
                    className="focus-ring rounded-md p-1 text-faint transition-colors hover:bg-warndim hover:text-warn"
                    title="Undo check-in"
                    onClick={() => {
                      const att = db.attendees.find((a) => a.code === s.code);
                      if (att) { api.undoCheckIn(att.id, `${user.name} (undo)`); toast({ kind: "info", title: "Check-in reversed", desc: att.name }); }
                    }}
                  >
                    <IUndo size={13} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function DoorDial({ pct }: { pct: number }) {
  const r = 34;
  const circ = 2 * Math.PI * r;
  return (
    <div className="relative h-[88px] w-[88px] shrink-0">
      <svg width={88} height={88} className="-rotate-90">
        <circle cx={44} cy={44} r={r} fill="none" stroke="var(--color-line)" strokeWidth={9} />
        <circle cx={44} cy={44} r={r} fill="none" stroke="var(--color-teal)" strokeWidth={9} strokeLinecap="round" strokeDasharray={`${(pct / 100) * circ} ${circ}`} style={{ transition: "stroke-dasharray 0.8s cubic-bezier(0.2,0.7,0.3,1)" }} />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-display text-[17px] font-bold">{pct}%</span>
    </div>
  );
}
