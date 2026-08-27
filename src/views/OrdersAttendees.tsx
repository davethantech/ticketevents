import { useMemo, useState } from "react";
import type { Attendee, Order } from "../lib/types";
import { useApp } from "../lib/store";
import { cx, downloadFile, fmtDateTime, money, money2, num, relTime, toCSV } from "../lib/utils";
import { downloadTicketsPDF } from "../lib/pdf";
import { Avatar, Badge, Button, Card, EmptyState, Field, Input, Modal, Segmented, Select, StatusPill, Textarea, useToast } from "../components/ui";
import { IDownload, IMail, IRefund, ISearch, ISend, ITicket, IX } from "../components/icons";

function Pager({ shown, total, more }: { shown: number; total: number; more: () => void }) {
  if (shown >= total) return null;
  return (
    <div className="flex justify-center border-t border-line py-3">
      <Button variant="outline" size="sm" onClick={more}>Show {Math.min(25, total - shown)} more of {num(total - shown)}</Button>
    </div>
  );
}

/* ================= Orders ================= */

export function OrdersView() {
  const { db, api, can } = useApp();
  const toast = useToast();
  const cur = db.settings.currency;
  const [q, setQ] = useState("");
  const [evFilter, setEvFilter] = useState("all");
  const [stFilter, setStFilter] = useState<"all" | Order["status"]>("all");
  const [limit, setLimit] = useState(25);
  const [detail, setDetail] = useState<Order | null>(null);
  const [refunding, setRefunding] = useState<Order | null>(null);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return db.orders.filter((o) => {
      if (evFilter !== "all" && o.eventId !== evFilter) return false;
      if (stFilter !== "all" && o.status !== stFilter) return false;
      if (needle && ![o.buyer.name, o.buyer.email, o.number, o.eventName].some((s) => s.toLowerCase().includes(needle))) return false;
      return true;
    });
  }, [db.orders, q, evFilter, stFilter]);

  const gross = filtered.filter((o) => o.status !== "refunded").reduce((s, o) => s + o.total, 0);
  const refundedTotal = filtered.filter((o) => o.status === "refunded").reduce((s, o) => s + o.total, 0);

  const exportCSV = () => {
    const rows: Array<Array<string | number>> = [["Order", "Date", "Event", "Buyer", "Email", "Tickets", "Promo", "Subtotal", "Discount", "Fees", "Tax", "Total", "Status"]];
    for (const o of filtered) {
      rows.push([o.number, new Date(o.createdAt).toISOString(), o.eventName, o.buyer.name, o.buyer.email, o.items.map((i) => `${i.qty}x ${i.name}`).join("; "), o.promo ?? "", o.subtotal.toFixed(2), o.discount.toFixed(2), o.fees.toFixed(2), o.tax.toFixed(2), o.total.toFixed(2), o.status]);
    }
    downloadFile(`stubhaus-orders-${Date.now()}.csv`, toCSV(rows));
    toast({ kind: "ok", title: "Orders exported", desc: `${num(filtered.length)} rows → CSV` });
  };

  return (
    <div className="mx-auto max-w-[1200px] space-y-4 px-5 pb-16 pt-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[28px] font-bold tracking-tight">Orders</h1>
          <p className="text-[13.5px] text-mut">
            {num(filtered.length)} orders · <span className="font-semibold text-ink">{money(gross, cur)}</span> gross
            {refundedTotal > 0 && <span className="text-bad"> · {money(refundedTotal, cur)} refunded</span>}
          </p>
        </div>
        <div className="flex gap-2">
          {can("export") && <Button variant="outline" onClick={exportCSV}><IDownload size={14} /> Export CSV</Button>}
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center gap-2.5 border-b border-line px-4 py-3">
          <div className="relative min-w-[220px] flex-1">
            <ISearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
            <Input className="pl-9" placeholder="Search buyer, email, order #…" value={q} onChange={(e) => { setQ(e.target.value); setLimit(25); }} />
          </div>
          <Select className="w-52" value={evFilter} onChange={(e) => setEvFilter(e.target.value)}>
            <option value="all">All events</option>
            {db.events.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </Select>
          <Segmented options={[{ value: "all", label: "All" }, { value: "paid", label: "Paid" }, { value: "free", label: "Free" }, { value: "refunded", label: "Refunded" }]} value={stFilter} onChange={(v) => setStFilter(v)} />
        </div>

        {filtered.length === 0 ? (
          <div className="p-6"><EmptyState icon={<ITicket size={20} />} title="No orders match" desc="Try a different search or clear the filters." action={<Button variant="outline" size="sm" onClick={() => { setQ(""); setEvFilter("all"); setStFilter("all"); }}><IX size={13} /> Clear filters</Button>} /></div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-left text-[13px]">
                <thead>
                  <tr className="code-pill border-b border-line text-[10.5px] uppercase tracking-widest text-faint">
                    <th className="px-4 py-2.5 font-semibold">Order</th>
                    <th className="px-4 py-2.5 font-semibold">Buyer</th>
                    <th className="px-4 py-2.5 font-semibold">Event</th>
                    <th className="px-4 py-2.5 font-semibold">Items</th>
                    <th className="px-4 py-2.5 text-right font-semibold">Total</th>
                    <th className="px-4 py-2.5 font-semibold">Status</th>
                    <th className="px-4 py-2.5 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {filtered.slice(0, limit).map((o) => (
                    <tr key={o.id} className={cx("transition-colors hover:bg-white/70", o.status === "refunded" && "opacity-60")}>
                      <td className="px-4 py-2.5">
                        <button className="code-pill focus-ring rounded text-[12px] font-bold hover:text-flame" onClick={() => setDetail(o)}>{o.number}</button>
                        <p className="text-[11px] text-faint">{relTime(o.createdAt)}</p>
                      </td>
                      <td className="px-4 py-2.5">
                        <p className="font-semibold">{o.buyer.name}</p>
                        <p className="text-[11.5px] text-mut">{o.buyer.email}</p>
                      </td>
                      <td className="max-w-[180px] truncate px-4 py-2.5 text-ink2">{o.eventName}</td>
                      <td className="px-4 py-2.5 text-ink2">{o.items.map((i) => `${i.qty}× ${i.name}`).join(", ")}{o.addOns.length > 0 && <span className="text-faint"> +{o.addOns.length} add-on{o.addOns.length > 1 ? "s" : ""}</span>}</td>
                      <td className="code-pill px-4 py-2.5 text-right font-bold">{money2(o.total, cur)}</td>
                      <td className="px-4 py-2.5"><StatusPill status={o.status} /></td>
                      <td className="px-4 py-2.5">
                        <div className="flex justify-end gap-1.5">
                          <Button size="sm" variant="ghost" onClick={() => setDetail(o)}>View</Button>
                          {o.status !== "refunded" && (
                            <Button size="sm" variant="ghost" className={can("refund") ? "text-bad hover:bg-baddim" : "opacity-40"} onClick={() => (can("refund") ? setRefunding(o) : toast({ kind: "bad", title: "No permission", desc: "Only owners & admins can refund." }))}>
                              <IRefund size={13} /> Refund
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pager shown={Math.min(limit, filtered.length)} total={filtered.length} more={() => setLimit(limit + 25)} />
          </>
        )}
      </Card>

      {/* detail modal */}
      <Modal open={!!detail} onClose={() => setDetail(null)} title={`Order ${detail?.number ?? ""}`} wide>
        {detail && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill status={detail.status} />
              <Badge tone="neutral">{fmtDateTime(detail.createdAt)}</Badge>
              {detail.promo && <Badge tone="flame">Promo {detail.promo}</Badge>}
              <Badge tone="neutral" className="ml-auto">{detail.method === "card" ? "Card" : detail.method === "free" ? "Free" : "Invoice"}</Badge>
            </div>
            <div className="rounded-lg border border-line bg-white p-4">
              <p className="text-[14px] font-bold">{detail.buyer.name}</p>
              <p className="text-[12.5px] text-mut">{detail.buyer.email}{detail.buyer.company ? ` · ${detail.buyer.company}` : ""}</p>
              <p className="mt-1 text-[12.5px] text-ink2">{detail.eventName}</p>
            </div>
            <div className="code-pill space-y-1.5 rounded-lg bg-night p-4 text-[12.5px] text-[#c8cec6]">
              {detail.items.map((i) => <div key={i.ticketId} className="flex justify-between"><span>{i.qty}× {i.name}</span><span>{money2(i.qty * i.unit, cur)}</span></div>)}
              {detail.addOns.map((a) => <div key={a.addOnId} className="flex justify-between"><span>{a.qty}× {a.name} (add-on)</span><span>{money2(a.qty * a.unit, cur)}</span></div>)}
              <div className="my-1.5 border-t border-nightline" />
              <div className="flex justify-between"><span>Subtotal</span><span>{money2(detail.subtotal, cur)}</span></div>
              {detail.discount > 0 && <div className="flex justify-between text-[#7fd6a4]"><span>Discount</span><span>−{money2(detail.discount, cur)}</span></div>}
              <div className="flex justify-between"><span>Fees</span><span>{money2(detail.fees, cur)}</span></div>
              <div className="flex justify-between"><span>Tax</span><span>{money2(detail.tax, cur)}</span></div>
              <div className="flex justify-between border-t border-nightline pt-1.5 text-[14px] font-bold text-white"><span>Total</span><span>{money2(detail.total, cur)}</span></div>
            </div>
            {detail.status !== "refunded" && (
              <div className="flex justify-end">
                <Button variant="danger" disabled={!can("refund")} onClick={() => { setRefunding(detail); setDetail(null); }}><IRefund size={14} /> Refund order</Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* refund confirm */}
      <Modal open={!!refunding} onClose={() => setRefunding(null)} title="Refund this order?">
        {refunding && (
          <>
            <p className="text-[13.5px] leading-relaxed text-ink2">
              <strong>{refunding.buyer.name}</strong> will be refunded <strong>{money2(refunding.total, cur)}</strong> for {refunding.items.map((i) => `${i.qty}× ${i.name}`).join(", ")}. Tickets are voided immediately and capacity is released.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setRefunding(null)}>Cancel</Button>
              <Button variant="danger" onClick={() => { api.refundOrder(refunding.id); toast({ kind: "ok", title: "Order refunded", desc: `${refunding.number} · ${money2(refunding.total, cur)}` }); setRefunding(null); }}>
                <IRefund size={14} /> Refund {money2(refunding.total, cur)}
              </Button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}

/* ================= Attendees ================= */

export function AttendeesView() {
  const { db, api, can } = useApp();
  const toast = useToast();
  const [q, setQ] = useState("");
  const [evFilter, setEvFilter] = useState("all");
  const [tierFilter, setTierFilter] = useState("all");
  const [stateFilter, setStateFilter] = useState<"all" | "checked" | "not" | "refunded">("all");
  const [limit, setLimit] = useState(25);
  const [compose, setCompose] = useState(false);
  const [msg, setMsg] = useState({ subject: "", body: "" });
  const [audience, setAudience] = useState("all");
  const [ticketOf, setTicketOf] = useState<Attendee | null>(null);

  const ev = db.events.find((e) => e.id === evFilter);
  const tiers = ev ? ev.tickets : [];

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return db.attendees.filter((a) => {
      if (evFilter !== "all" && a.eventId !== evFilter) return false;
      if (tierFilter !== "all" && a.ticketId !== tierFilter) return false;
      if (stateFilter === "checked" && !a.checkedInAt) return false;
      if (stateFilter === "not" && (a.checkedInAt || a.refunded)) return false;
      if (stateFilter === "refunded" && !a.refunded) return false;
      if (needle && ![a.name, a.email, a.code, a.orderNumber, a.eventName, a.ticketName].some((s) => s.toLowerCase().includes(needle))) return false;
      return true;
    });
  }, [db.attendees, q, evFilter, tierFilter, stateFilter]);

  const checkedCount = filtered.filter((a) => a.checkedInAt).length;

  const exportCSV = () => {
    const questionCols = ev ? ev.questions.map((qq) => qq.label) : [];
    const rows: Array<Array<string | number | boolean | undefined>> = [["Name", "Email", "Ticket", "Event", "Order", "QR code", "Checked in", "Refunded", ...questionCols]];
    for (const a of filtered) {
      const evq = db.events.find((e) => e.id === a.eventId)?.questions ?? [];
      rows.push([a.name, a.email, a.ticketName, a.eventName, a.orderNumber, a.code, a.checkedInAt ? new Date(a.checkedInAt).toISOString() : "", a.refunded ? "yes" : "", ...evq.map((qq) => a.answers[qq.id] ?? "")]);
    }
    downloadFile(`stubhaus-attendees-${Date.now()}.csv`, toCSV(rows));
    toast({ kind: "ok", title: "Attendees exported", desc: `${num(filtered.length)} rows → CSV` });
  };

  const audienceCount = useMemo(() => {
    const base = db.attendees.filter((a) => evFilter !== "all" ? a.eventId === evFilter : true).filter((a) => !a.refunded);
    if (audience === "checked") return base.filter((a) => a.checkedInAt).length;
    if (audience === "not") return base.filter((a) => !a.checkedInAt).length;
    if (audience.startsWith("tier:")) return base.filter((a) => a.ticketId === audience.slice(5)).length;
    return base.length;
  }, [db.attendees, evFilter, audience]);

  const sendMessage = () => {
    if (!msg.subject.trim() || !msg.body.trim()) return;
    api.sendMessage({
      eventId: evFilter === "all" ? (db.events[0]?.id ?? "") : evFilter,
      audience: audience === "all" ? "All ticket holders" : audience === "checked" ? "Checked-in" : audience === "not" ? "Not checked in" : (tiers.find((tt) => tt.id === audience.slice(5))?.name ?? "Tier"),
      subject: msg.subject, body: msg.body, recipients: audienceCount,
    });
    toast({ kind: "ok", title: "Message queued", desc: `Sending to ${num(audienceCount)} attendees…` });
    setCompose(false);
    setMsg({ subject: "", body: "" });
  };

  return (
    <div className="mx-auto max-w-[1200px] space-y-4 px-5 pb-16 pt-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[28px] font-bold tracking-tight">Attendees</h1>
          <p className="text-[13.5px] text-mut">{num(filtered.length)} people · {num(checkedCount)} checked in</p>
        </div>
        <div className="flex gap-2">
          {can("message") && <Button variant="outline" onClick={() => setCompose(true)}><IMail size={14} /> Message</Button>}
          {can("export") && <Button variant="outline" onClick={exportCSV}><IDownload size={14} /> Export CSV</Button>}
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center gap-2.5 border-b border-line px-4 py-3">
          <div className="relative min-w-[220px] flex-1">
            <ISearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
            <Input className="pl-9" placeholder="Search name, email, code, order…" value={q} onChange={(e) => { setQ(e.target.value); setLimit(25); }} />
          </div>
          <Select className="w-48" value={evFilter} onChange={(e) => { setEvFilter(e.target.value); setTierFilter("all"); setLimit(25); }}>
            <option value="all">All events</option>
            {db.events.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </Select>
          <Select className="w-44" value={tierFilter} onChange={(e) => { setTierFilter(e.target.value); setLimit(25); }} disabled={!ev}>
            <option value="all">All tiers</option>
            {tiers.map((tt) => <option key={tt.id} value={tt.id}>{tt.name}</option>)}
          </Select>
          <Segmented options={[{ value: "all", label: "All" }, { value: "checked", label: "In" }, { value: "not", label: "Expected" }, { value: "refunded", label: "Refunded" }]} value={stateFilter} onChange={(v) => { setStateFilter(v); setLimit(25); }} />
        </div>

        {filtered.length === 0 ? (
          <div className="p-6"><EmptyState icon={<ISearch size={20} />} title="Nobody here" desc="No attendees match those filters." /></div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] text-left text-[13px]">
                <thead>
                  <tr className="code-pill border-b border-line text-[10.5px] uppercase tracking-widest text-faint">
                    <th className="px-4 py-2.5 font-semibold">Attendee</th>
                    <th className="px-4 py-2.5 font-semibold">Ticket</th>
                    <th className="px-4 py-2.5 font-semibold">Code</th>
                    <th className="px-4 py-2.5 font-semibold">Status</th>
                    <th className="px-4 py-2.5 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {filtered.slice(0, limit).map((a) => (
                    <tr key={a.id} className={cx("transition-colors hover:bg-white/70", a.refunded && "opacity-55")}>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={a.name} color={["#e8431f", "#0e6b60", "#a86a14", "#b03a64"][a.name.length % 4]} size={30} />
                          <div>
                            <p className="font-semibold">{a.name}</p>
                            <p className="text-[11.5px] text-mut">{a.email} · <span className="code-pill">{a.orderNumber}</span></p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <p className="font-medium">{a.ticketName}</p>
                        <p className="max-w-[200px] truncate text-[11.5px] text-mut">{a.eventName}</p>
                      </td>
                      <td className="px-4 py-2.5"><span className="code-pill rounded border border-dashed border-line2 bg-white px-1.5 py-0.5 text-[11px] font-bold">{a.code}</span></td>
                      <td className="px-4 py-2.5">
                        {a.refunded ? <StatusPill status="refunded" /> : a.checkedInAt ? <Badge tone="ok">In · {new Date(a.checkedInAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</Badge> : <Badge tone="warn">Expected</Badge>}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex justify-end gap-1.5">
                          <Button size="sm" variant="ghost" onClick={() => setTicketOf(a)}><IDownload size={13} /> PDF</Button>
                          {a.checkedInAt && !a.refunded && can("checkin") && (
                            <Button size="sm" variant="ghost" onClick={() => { api.undoCheckIn(a.id, `${db.users.find((u) => u.id === db.currentUserId)?.name ?? "Staff"} (manual)`); toast({ kind: "info", title: "Check-in reversed", desc: a.name }); }}>Undo</Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pager shown={Math.min(limit, filtered.length)} total={filtered.length} more={() => setLimit(limit + 25)} />
          </>
        )}
      </Card>

      {/* compose */}
      <Modal open={compose} onClose={() => setCompose(false)} title="Message attendees" wide>
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Audience">
              <Select value={audience} onChange={(e) => setAudience(e.target.value)}>
                <option value="all">All ticket holders{evFilter !== "all" ? " (this event)" : ""}</option>
                <option value="checked">Checked-in only</option>
                <option value="not">Not checked in yet</option>
                {tiers.map((tt) => <option key={tt.id} value={`tier:${tt.id}`}>Tier: {tt.name}</option>)}
              </Select>
            </Field>
            <div className="flex items-end">
              <Badge tone="teal" className="mb-2.5">{num(audienceCount)} recipients</Badge>
            </div>
          </div>
          <Field label="Subject"><Input value={msg.subject} placeholder="Doors, parking & weather" onChange={(e) => setMsg({ ...msg, subject: e.target.value })} /></Field>
          <Field label="Body">
            <Textarea rows={5} value={msg.body} placeholder="Write something useful. Links and emoji are fine." onChange={(e) => setMsg({ ...msg, body: e.target.value })} />
          </Field>
          <p className="rounded-lg border border-line bg-white px-3.5 py-2.5 text-[12px] text-mut">
            Sent from <span className="code-pill font-semibold text-ink">{db.settings.email}</span> via your SMTP relay. Recipients can reply directly.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setCompose(false)}>Cancel</Button>
            <Button disabled={!msg.subject.trim() || !msg.body.trim() || audienceCount === 0} onClick={sendMessage}><ISend size={14} /> Send to {num(audienceCount)}</Button>
          </div>
        </div>
      </Modal>

      {/* single ticket pdf */}
      {ticketOf && <SingleTicketModal attendee={ticketOf} onClose={() => setTicketOf(null)} />}
    </div>
  );
}

function SingleTicketModal({ attendee, onClose }: { attendee: Attendee; onClose: () => void }) {
  const { db } = useApp();
  const ev = db.events.find((e) => e.id === attendee.eventId);
  if (!ev) return null;
  return (
    <Modal open onClose={onClose} title="Ticket PDF">
      <div className="flex items-center gap-4 rounded-xl border border-line bg-white p-4">
        <div className="shrink-0"><div className="stripe-hatch-dark flex h-20 w-20 items-center justify-center rounded-lg" style={{ background: ev.accent }}><ITicket size={26} className="text-white" /></div></div>
        <div className="min-w-0">
          <p className="truncate text-[14.5px] font-bold">{attendee.name}</p>
          <p className="text-[12.5px] text-mut">{attendee.ticketName} · {ev.name}</p>
          <p className="code-pill mt-1 text-[11.5px] font-bold tracking-widest text-ink2">{attendee.code}</p>
        </div>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>Close</Button>
        <Button onClick={() => downloadTicketsPDF([attendee], ev, db.settings)}><IDownload size={14} /> Download PDF</Button>
      </div>
    </Modal>
  );
}
