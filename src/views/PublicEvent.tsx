import { useMemo, useState } from "react";
import type { Attendee, EventItem, Order, PromoCode, Question } from "../lib/types";
import { TYPE_LABEL, eventSold, useApp } from "../lib/store";
import { cx, fmtDate, fmtTime, money2, num } from "../lib/utils";
import { downloadTicketsPDF } from "../lib/pdf";
import { Button, Input, Field, QrImg, Badge, Toggle } from "../components/ui";
import { ICalendar, ICheck, IChevronR, IDownload, IPin, ITag, ITicket, IClock } from "../components/icons";

type Step = "select" | "details" | "done";

export default function PublicEvent({ slug, embedded, onNavigateHome }: { slug: string; embedded?: boolean; onNavigateHome?: () => void }) {
  const { db, api, totals } = useApp();
  const ev = db.events.find((e) => e.slug === slug);
  const cur = db.settings.currency;

  const [qtys, setQtys] = useState<Record<string, number>>({});
  const [addOnQtys, setAddOnQtys] = useState<Record<string, number>>({});
  const [promoInput, setPromoInput] = useState("");
  const [promo, setPromo] = useState<PromoCode | null>(null);
  const [promoError, setPromoError] = useState("");
  const [step, setStep] = useState<Step>("select");
  const [buyer, setBuyer] = useState({ name: "", email: "", company: "" });
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{ order: Order; attendees: Attendee[] } | null>(null);

  const items = useMemo(() => Object.entries(qtys).filter(([, q]) => q > 0).map(([ticketId, qty]) => ({ ticketId, qty })), [qtys]);
  const addOns = useMemo(() => Object.entries(addOnQtys).filter(([, q]) => q > 0).map(([addOnId, qty]) => ({ addOnId, qty })), [addOnQtys]);
  const ticketCount = items.reduce((s, i) => s + i.qty, 0);

  if (!ev) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center p-8 text-center">
        <div>
          <p className="font-display text-[24px] font-bold">Event not found</p>
          <p className="mt-2 text-[13.5px] text-mut">This link may be outdated.</p>
          {onNavigateHome && <Button className="mt-5" onClick={onNavigateHome}>Back to dashboard</Button>}
        </div>
      </div>
    );
  }

  const soldOutAll = ev.tickets.every((t) => !t.active || t.sold >= t.capacity);
  const saleClosed = ev.status !== "live" || soldOutAll;

  const t = totals(ev, items, addOns, promo ?? undefined);

  const applyPromo = () => {
    setPromoError("");
    const p = ev.promos.find((x) => x.code.toLowerCase() === promoInput.trim().toLowerCase() && x.active);
    if (!p) { setPromoError("That code isn't valid here."); setPromo(null); return; }
    if (p.used >= p.limit) { setPromoError("That code has been fully redeemed."); setPromo(null); return; }
    setPromo(p);
  };

  const submit = () => {
    setError("");
    if (!buyer.name.trim()) { setError("Please enter your name."); return; }
    if (ev.checkout.requireEmail && !/^\S+@\S+\.\S+$/.test(buyer.email)) { setError("Please enter a valid email."); return; }
    for (const q of ev.questions) {
      if (q.required && !(answers[q.id] ?? "").trim()) { setError(`Please answer: ${q.label}`); return; }
    }
    setProcessing(true);
    window.setTimeout(() => {
      const res = api.placeOrder(ev.id, {
        items,
        addOns,
        promoCode: promo?.code,
        buyer: { name: buyer.name.trim(), email: buyer.email.trim(), company: ev.checkout.collectCompany ? buyer.company.trim() || undefined : undefined },
        answers,
      });
      setProcessing(false);
      if (!res.ok) { setError(res.error ?? "Something went wrong."); setStep("select"); return; }
      setResult({ order: res.order!, attendees: res.attendees! });
      setStep("done");
    }, 900);
  };

  const accent = ev.accent;

  return (
    <div className={cx("min-h-screen", embedded ? "" : "bg-bg")}>
      {/* header */}
      <div className="relative overflow-hidden" style={{ background: "#141917" }}>
        <img src={ev.cover} alt="" className="absolute inset-0 h-full w-full object-cover opacity-60" />
        <div className="absolute inset-0" style={{ background: `linear-gradient(to top, #141917 4%, #14191788 45%, #14191744)` }} />
        <div className={cx("relative mx-auto max-w-[1060px] px-5", embedded ? "pb-5 pt-6" : "pb-10 pt-14")}>
          {!embedded && (
            <button onClick={onNavigateHome} className="code-pill mb-6 inline-flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-[#9aa29a] transition-colors hover:text-white">
              ← Organizer dashboard
            </button>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-white" style={{ background: accent }}>{TYPE_LABEL[ev.type]}</span>
            {ev.status === "draft" && <Badge tone="warn">Preview — not public yet</Badge>}
            {ev.status === "ended" && <Badge>Event ended</Badge>}
            {soldOutAll && ev.status === "live" && <Badge tone="bad">Sold out</Badge>}
          </div>
          <h1 className={cx("mt-3 font-display font-bold leading-[1.02] tracking-tight text-white", embedded ? "text-[24px]" : "text-[38px] sm:text-[48px]")}>{ev.name}</h1>
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 text-[13.5px] text-[#d4d9d2]">
            <span className="inline-flex items-center gap-2"><ICalendar size={15} style={{ color: accent }} />{fmtDate(ev.start)} · {fmtTime(ev.start)}</span>
            <span className="inline-flex items-center gap-2"><IPin size={15} style={{ color: accent }} />{ev.venue} — {ev.city}</span>
          </div>
        </div>
      </div>

      <div className={cx("mx-auto max-w-[1060px] px-5", embedded ? "py-4" : "py-8")}>
        <div className={cx("grid gap-6", !embedded && "lg:grid-cols-[1.5fr_1fr]")}>
          {/* left column */}
          {!embedded && (
            <div className="space-y-6">
              <section>
                <h2 className="code-pill text-[11px] uppercase tracking-widest text-faint">About</h2>
                <p className="mt-2 whitespace-pre-line text-[15px] leading-relaxed text-ink2">{ev.description}</p>
              </section>
              {ev.addOns.filter((a) => a.active).length > 0 && (
                <section>
                  <h2 className="code-pill text-[11px] uppercase tracking-widest text-faint">Good to know</h2>
                  <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
                    {ev.addOns.filter((a) => a.active).map((a) => (
                      <div key={a.id} className="flex items-start gap-3 rounded-lg border border-line bg-paper p-3.5">
                        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-white" style={{ background: accent }}><ITicket size={14} /></span>
                        <div>
                          <p className="text-[13.5px] font-semibold">{a.name} · {money2(a.price, cur)}</p>
                          <p className="text-[12px] text-mut">{a.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
              <section className="rounded-xl border border-line bg-paper p-5">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: `${accent}1a`, color: accent }}><IPin size={18} /></span>
                  <div>
                    <p className="text-[14.5px] font-bold">{ev.venue}</p>
                    <p className="text-[12.5px] text-mut">{ev.city} · doors typically open 60 min before start</p>
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* ticket box */}
          <div className={cx(!embedded && "lg:sticky lg:top-6 lg:self-start")}>
            <div className="overflow-hidden rounded-xl border border-line bg-paper shadow-[var(--shadow-pop)]">
              <div className="flex items-center justify-between border-b border-dashed border-line2 px-5 py-3.5" style={{ background: `${accent}0d` }}>
                <p className="font-display text-[15px] font-bold tracking-tight">{step === "done" ? "Your tickets" : "Tickets"}</p>
                <span className="code-pill text-[11px] text-mut">{num(eventSold(ev))} sold</span>
              </div>

              {step === "select" && (
                <div className="p-5">
                  <div className="space-y-3">
                    {ev.tickets.filter((tk) => tk.active).map((tk) => {
                      const remaining = tk.capacity - tk.sold;
                      const soldOut = remaining <= 0;
                      const q = qtys[tk.id] ?? 0;
                      return (
                        <div key={tk.id} className={cx("rounded-lg border p-3.5 transition-all", q > 0 ? "border-current shadow-sm" : "border-line", soldOut && "opacity-55")} style={q > 0 ? { borderColor: accent } : undefined}>
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-[14px] font-bold">{tk.name}</p>
                              <p className="text-[12px] text-mut">{tk.description}</p>
                            </div>
                            <p className="font-display text-[16px] font-bold whitespace-nowrap">{tk.price === 0 ? "Free" : money2(tk.price, cur)}</p>
                          </div>
                          <div className="mt-2.5 flex items-center justify-between">
                            <span className="text-[11px] font-medium text-faint">{soldOut ? "Sold out" : `${num(remaining)} left`}</span>
                            {!soldOut && !saleClosed && (
                              <div className="flex items-center gap-2.5">
                                <button onClick={() => setQtys({ ...qtys, [tk.id]: Math.max(0, q - 1) })} disabled={q === 0} className="focus-ring flex h-7 w-7 items-center justify-center rounded-md border border-line2 text-[15px] font-bold transition-all hover:border-faint active:scale-90 disabled:opacity-30">−</button>
                                <span className={cx("code-pill w-5 text-center text-[14px]", q > 0 && "font-bold")} style={q > 0 ? { color: accent } : undefined}>{q}</span>
                                <button onClick={() => setQtys({ ...qtys, [tk.id]: Math.min(8, remaining, q + 1) })} className="focus-ring flex h-7 w-7 items-center justify-center rounded-md border text-[15px] font-bold text-white transition-all active:scale-90" style={{ background: accent }}>+</button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {ev.addOns.filter((a) => a.active).length > 0 && (
                    <>
                      <p className="code-pill mb-2 mt-5 text-[11px] uppercase tracking-widest text-faint">Add-ons</p>
                      <div className="space-y-2">
                        {ev.addOns.filter((a) => a.active).map((a) => {
                          const q = addOnQtys[a.id] ?? 0;
                          return (
                            <div key={a.id} className={cx("flex items-center justify-between rounded-lg border px-3 py-2.5 transition-all", q > 0 ? "" : "border-line")} style={q > 0 ? { borderColor: accent, background: `${accent}0a` } : undefined}>
                              <div>
                                <p className="text-[13px] font-semibold">{a.name}</p>
                                <p className="text-[11.5px] text-mut">{money2(a.price, cur)} · {a.description}</p>
                              </div>
                              {!saleClosed && (
                                <div className="flex items-center gap-2">
                                  <button onClick={() => setAddOnQtys({ ...addOnQtys, [a.id]: Math.max(0, q - 1) })} disabled={q === 0} className="focus-ring flex h-6 w-6 items-center justify-center rounded border border-line2 text-[13px] font-bold transition-all active:scale-90 disabled:opacity-30">−</button>
                                  <span className="code-pill w-4 text-center text-[13px]">{q}</span>
                                  <button onClick={() => setAddOnQtys({ ...addOnQtys, [a.id]: Math.min(8, q + 1) })} className="focus-ring flex h-6 w-6 items-center justify-center rounded text-[13px] font-bold text-white transition-all active:scale-90" style={{ background: accent }}>+</button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}

                  {ev.checkout.allowPromos && (
                    <div className="mt-4">
                      {promo ? (
                        <div className="flex items-center justify-between rounded-lg border border-teal/30 bg-tealdim px-3 py-2">
                          <span className="flex items-center gap-2 text-[12.5px] font-bold text-teal"><ITag size={13} />{promo.code} applied — {promo.kind === "percent" ? `${promo.value}% off` : `${money2(promo.value, cur)} off`}</span>
                          <button onClick={() => { setPromo(null); setPromoInput(""); }} className="text-[11.5px] font-semibold text-mut underline-offset-2 hover:underline">remove</button>
                        </div>
                      ) : (
                        <>
                          <div className="flex gap-2">
                            <Input className="code-pill h-9 uppercase" placeholder="Promo code" value={promoInput} onChange={(e) => setPromoInput(e.target.value)} />
                            <Button variant="outline" size="sm" className="h-9" disabled={!promoInput.trim()} onClick={applyPromo}>Apply</Button>
                          </div>
                          {promoError && <p className="mt-1.5 text-[12px] font-medium text-bad">{promoError}</p>}
                        </>
                      )}
                    </div>
                  )}

                  {(ticketCount > 0 || addOns.length > 0) && (
                    <div className="code-pill mt-5 space-y-1.5 rounded-lg bg-night p-4 text-[12.5px] text-[#c8cec6]">
                      <div className="flex justify-between"><span>Subtotal</span><span>{money2(t.subtotal, cur)}</span></div>
                      {t.discount > 0 && <div className="flex justify-between text-[#7fd6a4]"><span>Discount</span><span>−{money2(t.discount, cur)}</span></div>}
                      <div className="flex justify-between"><span>Fees</span><span>{money2(t.fees, cur)}</span></div>
                      <div className="flex justify-between"><span>Tax</span><span>{money2(t.tax, cur)}</span></div>
                      <div className="flex justify-between border-t border-nightline pt-2 text-[14px] font-bold text-white"><span>Total</span><span>{money2(t.total, cur)}</span></div>
                    </div>
                  )}

                  <button
                    disabled={ticketCount === 0 || saleClosed}
                    onClick={() => setStep("details")}
                    className="focus-ring mt-4 flex w-full items-center justify-center gap-2 rounded-lg py-3.5 text-[14.5px] font-bold text-white transition-all hover:brightness-110 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40"
                    style={{ background: accent }}
                  >
                    {saleClosed ? (soldOutAll ? "Sold out" : "Sales closed") : t.total === 0 && ticketCount > 0 ? "Reserve free tickets" : ev.checkout.buttonLabel}
                    {!saleClosed && <IChevronR size={16} />}
                  </button>
                  {ev.checkout.note && <p className="mt-2.5 text-center text-[11.5px] text-faint">{ev.checkout.note}</p>}
                </div>
              )}

              {step === "details" && (
                <div className="space-y-3.5 p-5">
                  <button onClick={() => setStep("select")} className="code-pill text-[11px] uppercase tracking-widest text-faint hover:text-ink">← Back to tickets</button>
                  <Field label="Full name"><Input autoFocus value={buyer.name} onChange={(e) => setBuyer({ ...buyer, name: e.target.value })} placeholder="Ada Lovelace" /></Field>
                  {ev.checkout.requireEmail && <Field label="Email" hint="tickets are sent here"><Input type="email" value={buyer.email} onChange={(e) => setBuyer({ ...buyer, email: e.target.value })} placeholder="ada@analytical.engine" /></Field>}
                  {ev.checkout.collectCompany && <Field label="Company"><Input value={buyer.company} onChange={(e) => setBuyer({ ...buyer, company: e.target.value })} /></Field>}

                  {ev.questions.map((q) => (
                    <QuestionField key={q.id} q={q} value={answers[q.id] ?? ""} onChange={(v) => setAnswers({ ...answers, [q.id]: v })} accent={accent} />
                  ))}

                  <div className="code-pill rounded-lg bg-night p-3.5 text-[12.5px] text-[#c8cec6]">
                    <div className="flex justify-between font-bold text-white"><span>{ticketCount} ticket{ticketCount > 1 ? "s" : ""}{addOns.length > 0 ? " + add-ons" : ""}</span><span>{money2(t.total, cur)}</span></div>
                  </div>
                  {error && <p className="rounded-lg border border-bad/30 bg-baddim px-3 py-2 text-[12.5px] font-medium text-bad">{error}</p>}
                  <button
                    onClick={submit}
                    disabled={processing}
                    className="focus-ring flex w-full items-center justify-center gap-2 rounded-lg py-3.5 text-[14.5px] font-bold text-white transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
                    style={{ background: accent }}
                  >
                    {processing ? (
                      <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />Processing…</>
                    ) : t.total === 0 ? "Confirm reservation" : `Pay ${money2(t.total, cur)}`}
                  </button>
                  <p className="text-center text-[11px] text-faint">Demo checkout — no real payment is collected.</p>
                </div>
              )}

              {step === "done" && result && (
                <div className="p-5">
                  <div className="mb-4 flex items-center gap-3 rounded-lg border border-ok/25 bg-okdim px-3.5 py-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ok text-white"><ICheck size={16} /></span>
                    <div>
                      <p className="text-[13.5px] font-bold text-ok">Order {result.order.number} confirmed</p>
                      <p className="text-[12px] text-ink2">{result.order.total === 0 ? "Free reservation" : `${money2(result.order.total, cur)} paid`} · receipt sent to {result.order.buyer.email}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {result.attendees.map((a) => (
                      <div key={a.id} className="flex items-center gap-3.5 rounded-xl border border-line bg-white p-3.5">
                        <div className="shrink-0 rounded-lg border border-line p-1.5"><QrImg value={`STUBHAUS~${ev.slug}~${a.code}`} size={76} /></div>
                        <div className="relative min-w-0 flex-1">
                          <p className="truncate text-[14px] font-bold">{a.name}</p>
                          <p className="text-[12px] text-mut">{a.ticketName}</p>
                          <p className="code-pill mt-1.5 inline-block rounded border border-dashed border-line2 px-2 py-0.5 text-[11.5px] font-bold tracking-widest">{a.code}</p>
                          <span className="perf-y absolute -left-3.5 top-0 h-full" />
                        </div>
                      </div>
                    ))}
                  </div>

                  <Button className="mt-4 w-full" style={{ background: accent, boxShadow: "none" }} onClick={() => downloadTicketsPDF(result.attendees, ev, db.settings)}>
                    <IDownload size={15} /> Download PDF tickets
                  </Button>
                  <button onClick={() => { setStep("select"); setQtys({}); setAddOnQtys({}); setPromo(null); setPromoInput(""); setBuyer({ name: "", email: "", company: "" }); setAnswers({}); setResult(null); }} className="focus-ring mt-2.5 w-full rounded-lg py-2 text-[12.5px] font-semibold text-mut transition-colors hover:text-ink">
                    Buy more tickets
                  </button>
                </div>
              )}
            </div>
            <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[11px] text-faint">
              <IClock size={11} /> Secure checkout · powered by <span className="font-display font-bold text-mut">Stubhaus</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function QuestionField({ q, value, onChange, accent }: { q: Question; value: string; onChange: (v: string) => void; accent: string }) {
  if (q.type === "select") {
    return (
      <Field label={q.label + (q.required ? " *" : "")}>
        <select value={value} onChange={(e) => onChange(e.target.value)} className="focus-ring h-10 w-full rounded-lg border border-line2 bg-white px-3 text-[13.5px]">
          <option value="">Select…</option>
          {(q.options ?? []).map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      </Field>
    );
  }
  if (q.type === "checkbox") {
    const checked = value === "Yes";
    return (
      <div className="flex items-center justify-between rounded-lg border border-line bg-white px-3 py-2.5">
        <span className="text-[13px] font-medium text-ink2">{q.label}{q.required && " *"}</span>
        <Toggle checked={checked} onChange={(v) => onChange(v ? "Yes" : "")} />
      </div>
    );
  }
  return <Field label={q.label + (q.required ? " *" : "")}><Input value={value} onChange={(e) => onChange(e.target.value)} /></Field>;
}
