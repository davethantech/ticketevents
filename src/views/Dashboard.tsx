import { useMemo } from "react";
import { eventCapacity, eventCheckedIn, eventRevenue, eventSold, useApp } from "../lib/store";
import { daysUntil, fmtDateShort, money, num, relTime } from "../lib/utils";
import { Avatar, Badge, Bars, Card, ProgressBar, Reveal, Sparkline, StatusPill, useCountUp } from "../components/ui";
import { IArrowR, ICalendar, IPin, IQr, IScan, ITag, ITicket } from "../components/icons";

function KpiValue({ value, format }: { value: number; format: (n: number) => string }) {
  const v = useCountUp(value);
  return <span className="tabular">{format(v)}</span>;
}

export default function Dashboard({ navigate }: { navigate: (to: string) => void }) {
  const { db, user } = useApp();
  const cur = db.settings.currency;

  const stats = useMemo(() => {
    const now = Date.now();
    const d30 = now - 30 * 86400000;
    const orders30 = db.orders.filter((o) => new Date(o.createdAt).getTime() >= d30 && o.status !== "refunded");
    const revenue30 = orders30.reduce((s, o) => s + o.total, 0);
    const tickets30 = orders30.reduce((s, o) => s + o.items.reduce((x, i) => x + i.qty, 0), 0);

    const daily: number[] = [];
    const labels: string[] = [];
    for (let d = 13; d >= 0; d -= 1) {
      const day = new Date();
      day.setHours(0, 0, 0, 0);
      day.setDate(day.getDate() - d);
      const next = day.getTime() + 86400000;
      daily.push(db.orders.filter((o) => o.status !== "refunded" && new Date(o.createdAt).getTime() >= day.getTime() && new Date(o.createdAt).getTime() < next).reduce((s, o) => s + o.total, 0));
      labels.push(day.toLocaleDateString("en-US", { month: "short", day: "numeric" }));
    }
    const spark: number[] = [];
    for (let d = 29; d >= 0; d -= 1) {
      const day = new Date();
      day.setHours(0, 0, 0, 0);
      day.setDate(day.getDate() - d);
      const next = day.getTime() + 86400000;
      spark.push(db.orders.filter((o) => o.status !== "refunded" && new Date(o.createdAt).getTime() >= day.getTime() && new Date(o.createdAt).getTime() < next).reduce((s, o) => s + o.total, 0));
    }
    const checkedToday = db.attendees.filter((a) => a.checkedInAt && new Date(a.checkedInAt).toDateString() === new Date().toDateString()).length;
    const live = db.events.filter((e) => e.status === "live");
    return { revenue30, tickets30, daily, labels, spark, checkedToday, live };
  }, [db]);

  const gross = useCountUp(stats.revenue30);
  const upcoming = [...db.events].filter((e) => e.status !== "ended").sort((a, b) => (a.start < b.start ? -1 : 1)).slice(0, 4);
  const recentOrders = db.orders.slice(0, 7);
  const tonight = db.events.find((e) => e.status === "live" && daysUntil(e.start) <= 0 && daysUntil(e.end) >= -1);

  return (
    <div className="mx-auto max-w-[1200px] space-y-5 px-5 pb-16 pt-6 lg:px-8">
      {/* header strip */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="code-pill text-[11px] uppercase text-mut">{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>
          <h1 className="mt-1 font-display text-[32px] font-bold leading-none tracking-tight lg:text-[38px]">
            {new Date().getHours() < 12 ? "Morning" : new Date().getHours() < 18 ? "Afternoon" : "Evening"}, {user.name.split(" ")[0]}
          </h1>
        </div>
        {tonight && (
          <button
            onClick={() => navigate(`/checkin?event=${tonight.id}`)}
            className="focus-ring group flex items-center gap-3 rounded-xl border border-flame/30 bg-flamedim px-4 py-2.5 text-left transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-pop)]"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-flame opacity-60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-flame" />
            </span>
            <span>
              <span className="block text-[11px] font-bold uppercase tracking-widest text-flame">Gates open tonight</span>
              <span className="block text-[13.5px] font-semibold text-ink">{tonight.name} — open check-in</span>
            </span>
            <IArrowR size={16} className="text-flame transition-transform group-hover:translate-x-0.5" />
          </button>
        )}
      </div>

      {/* KPI band */}
      <Reveal>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-[1.35fr_1fr_1fr_1fr]">
          <div className="stripe-hatch-dark relative col-span-2 overflow-hidden rounded-xl bg-night p-5 text-[#f0f2ee] lg:col-span-1">
            <div className="absolute -right-10 -top-14 h-44 w-44 rounded-full bg-flame/20 blur-2xl" />
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#8d968e]">Gross · last 30 days</p>
            <p className="mt-2 font-display text-[34px] font-bold leading-none tracking-tight">
              <KpiValue value={stats.revenue30} format={(n) => money(n, cur)} />
            </p>
            <div className="mt-3 flex items-end justify-between">
              <Sparkline data={stats.spark} width={150} height={36} color="var(--color-flame2)" />
              <Badge tone="ok" className="border-ok/40 bg-ok/20 text-[#7fd6a4]">+{Math.round((stats.daily.slice(-7).reduce((a, b) => a + b, 0) / (stats.daily.slice(0, 7).reduce((a, b) => a + b, 0) || 1) - 1) * 100)}% wk/wk</Badge>
            </div>
          </div>

          {[
            { label: "Tickets sold · 30d", v: stats.tickets30, fmt: (n: number) => num(Math.round(n)), icon: <ITicket size={15} />, to: "/orders" },
            { label: "Checked in today", v: stats.checkedToday, fmt: (n: number) => num(Math.round(n)), icon: <IScan size={15} />, to: "/checkin" },
            { label: "Live events", v: stats.live.length, fmt: (n: number) => String(Math.round(n)), icon: <ICalendar size={15} />, to: "/events" },
          ].map((k, i) => (
            <button key={k.label} onClick={() => navigate(k.to)} className="focus-ring group rounded-xl border border-line bg-paper p-5 text-left shadow-[var(--shadow-lift)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-pop)]" style={{ transitionDelay: `${i * 40}ms` }}>
              <div className="flex items-center justify-between text-mut">
                <p className="text-[11px] font-bold uppercase tracking-widest">{k.label}</p>
                <span className="text-faint transition-colors group-hover:text-flame">{k.icon}</span>
              </div>
              <p className="mt-3 font-display text-[30px] font-bold leading-none tracking-tight text-ink">
                <KpiValue value={k.v} format={k.fmt} />
              </p>
              <p className="mt-2.5 flex items-center gap-1 text-[11.5px] font-semibold text-faint transition-colors group-hover:text-flame">
                View <IArrowR size={12} />
              </p>
            </button>
          ))}
        </div>
      </Reveal>

      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        {/* sales chart */}
        <Reveal>
          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="font-display text-[17px] font-bold tracking-tight">Sales, last 14 days</h2>
                <p className="text-[12.5px] text-mut">Gross by day, all events</p>
              </div>
              <button onClick={() => navigate("/reports")} className="focus-ring flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12.5px] font-semibold text-teal transition-colors hover:bg-tealdim">
                Full report <IArrowR size={13} />
              </button>
            </div>
            <Bars data={stats.daily} labels={stats.labels} height={170} moneyFn={(n) => money(n, cur)} />
            <div className="mt-2 flex justify-between text-[10.5px] font-medium uppercase tracking-wider text-faint">
              <span>{stats.labels[0]}</span>
              <span>{stats.labels[stats.labels.length - 1]}</span>
            </div>
          </Card>
        </Reveal>

        {/* upcoming */}
        <Reveal delay={80}>
          <Card className="flex h-full flex-col p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-[17px] font-bold tracking-tight">On the calendar</h2>
              <button onClick={() => navigate("/events")} className="focus-ring rounded-lg px-2 py-1 text-[12.5px] font-semibold text-teal hover:bg-tealdim">All events</button>
            </div>
            <div className="space-y-2.5">
              {upcoming.map((e) => {
                const sold = eventSold(e);
                const cap = eventCapacity(e);
                const ci = eventCheckedIn(db.attendees, e.id);
                return (
                  <button key={e.id} onClick={() => navigate(`/events/${e.id}`)} className="focus-ring group flex w-full items-center gap-3.5 rounded-lg border border-transparent p-2 text-left transition-all hover:border-line hover:bg-white">
                    <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-lg" style={{ background: e.accent }}>
                      <img src={e.cover} alt="" className="h-full w-full object-cover opacity-90 transition-transform duration-300 group-hover:scale-105" loading="lazy" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-[13.5px] font-semibold">{e.name}</p>
                        <StatusPill status={e.status} />
                      </div>
                      <p className="mt-0.5 flex items-center gap-2 text-[12px] text-mut">
                        <span className="inline-flex items-center gap-1"><ICalendar size={12} />{fmtDateShort(e.start)}</span>
                        <span className="inline-flex items-center gap-1 truncate"><IPin size={12} />{e.city}</span>
                      </p>
                      {e.status === "live" && (
                        <div className="mt-1.5 flex items-center gap-2">
                          <ProgressBar value={cap ? (sold / cap) * 100 : 0} color={e.accent} className="flex-1" />
                          <span className="code-pill text-[10.5px] text-mut">{num(sold)}/{num(cap)}{ci > 0 && ` · ${num(ci)} in`}</span>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>
        </Reveal>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        {/* recent orders */}
        <Reveal>
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
              <h2 className="font-display text-[17px] font-bold tracking-tight">Latest orders</h2>
              <button onClick={() => navigate("/orders")} className="focus-ring rounded-lg px-2 py-1 text-[12.5px] font-semibold text-teal hover:bg-tealdim">All orders</button>
            </div>
            <div className="divide-y divide-line">
              {recentOrders.map((o) => (
                <div key={o.id} className="flex items-center gap-3 px-5 py-2.5 transition-colors hover:bg-white/70">
                  <Avatar name={o.buyer.name} color={["#e8431f", "#0e6b60", "#a86a14", "#b03a64"][o.buyer.name.length % 4]} size={30} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold">{o.buyer.name} <span className="font-normal text-mut">· {o.items.map((i) => `${i.qty}× ${i.name}`).join(", ")}</span></p>
                    <p className="truncate text-[11.5px] text-mut">{o.eventName} · {relTime(o.createdAt)}</p>
                  </div>
                  {o.promo && <Badge tone="flame"><ITag size={10} />{o.promo}</Badge>}
                  <StatusPill status={o.status} />
                  <span className="code-pill w-[76px] text-right text-[13px] font-semibold">{money(o.total, cur)}</span>
                </div>
              ))}
            </div>
          </Card>
        </Reveal>

        {/* promos + checkin pulse */}
        <Reveal delay={80}>
          <div className="space-y-5">
            <Card className="p-5">
              <h2 className="mb-3 font-display text-[17px] font-bold tracking-tight">Promo pulse</h2>
              <div className="space-y-3">
                {db.events.flatMap((e) => e.promos.filter((p) => p.active).map((p) => ({ e, p }))).slice(0, 4).map(({ e, p }) => (
                  <div key={p.id} className="flex items-center gap-3">
                    <span className="code-pill rounded-md border border-dashed border-flame/50 bg-flamedim px-2 py-1 text-[11px] font-bold text-flame">{p.code}</span>
                    <div className="min-w-0 flex-1">
                      <ProgressBar value={(p.used / p.limit) * 100} color="var(--color-flame)" />
                    </div>
                    <span className="code-pill text-[11px] text-mut">{p.used}/{p.limit}</span>
                  </div>
                ))}
                {db.events.every((e) => e.promos.length === 0) && <p className="text-[13px] text-mut">No active promo codes yet.</p>}
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-[17px] font-bold tracking-tight">Door status</h2>
                <Badge tone="night"><IQr size={11} /> scanner</Badge>
              </div>
              {tonight ? (
                <div className="mt-3">
                  <p className="text-[13px] text-ink2">
                    <span className="font-semibold text-ink">{num(eventCheckedIn(db.attendees, tonight.id))}</span> of{" "}
                    <span className="font-semibold text-ink">{num(eventSold(tonight))}</span> through the door at {tonight.venue}.
                  </p>
                  <ProgressBar value={(eventCheckedIn(db.attendees, tonight.id) / (eventSold(tonight) || 1)) * 100} color="var(--color-teal)" className="mt-2.5" />
                  <button onClick={() => navigate(`/checkin?event=${tonight.id}`)} className="focus-ring mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-teal py-2.5 text-[13px] font-semibold text-white transition-all hover:bg-[#0b5a50] active:scale-[0.98]">
                    <IScan size={15} /> Open scanner
                  </button>
                </div>
              ) : (
                <p className="mt-3 text-[13px] leading-relaxed text-mut">No gates open right now. Revenue from {db.events.length} events is settling in the meantime.</p>
              )}
            </Card>
          </div>
        </Reveal>
      </div>

      {/* revenue by event strip */}
      <Reveal>
        <Card className="flex flex-wrap items-center gap-x-8 gap-y-3 px-6 py-4">
          <span className="code-pill text-[11px] uppercase tracking-widest text-faint">Lifetime by event</span>
          {db.events.map((e) => (
            <button key={e.id} onClick={() => navigate(`/events/${e.id}`)} className="focus-ring group flex items-center gap-2.5 rounded-lg px-1 py-0.5 text-left">
              <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: e.accent }} />
              <span className="text-[13px] font-medium text-ink2 transition-colors group-hover:text-ink">{e.name}</span>
              <span className="code-pill text-[12.5px] font-semibold text-ink">{money(eventRevenue(db.orders, e.id), cur)}</span>
            </button>
          ))}
        </Card>
      </Reveal>
    </div>
  );
}
