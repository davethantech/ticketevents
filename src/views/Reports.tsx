import { useMemo, useState } from "react";
import { eventRevenue, eventSold, useApp } from "../lib/store";
import { downloadFile, money, num, toCSV } from "../lib/utils";
import { Bars, Button, Card, Donut, HBar, Reveal, Segmented, StatusPill, useCountUp, useToast } from "../components/ui";
import { IDownload, ITicket } from "../components/icons";

const TIER_COLORS = ["#e8431f", "#0e6b60", "#a86a14", "#b03a64", "#5b5bd6", "#161a18"];

export default function Reports() {
  const { db, can } = useApp();
  const toast = useToast();
  const cur = db.settings.currency;
  const [range, setRange] = useState<"7" | "14" | "30">("14");

  const data = useMemo(() => {
    const days = Number(range);
    const cutoff = Date.now() - days * 86400000;
    const orders = db.orders.filter((o) => new Date(o.createdAt).getTime() >= cutoff);
    const good = orders.filter((o) => o.status !== "refunded");
    const gross = good.reduce((s, o) => s + o.total, 0);
    const refunded = orders.filter((o) => o.status === "refunded").reduce((s, o) => s + o.total, 0);
    const tickets = good.reduce((s, o) => s + o.items.reduce((x, i) => x + i.qty, 0), 0);
    const avg = good.length ? gross / good.length : 0;
    const fees = good.reduce((s, o) => s + o.fees, 0);
    const tax = good.reduce((s, o) => s + o.tax, 0);

    const daily: number[] = [];
    const labels: string[] = [];
    for (let d = days - 1; d >= 0; d -= 1) {
      const day = new Date();
      day.setHours(0, 0, 0, 0);
      day.setDate(day.getDate() - d);
      const next = day.getTime() + 86400000;
      daily.push(good.filter((o) => new Date(o.createdAt).getTime() >= day.getTime() && new Date(o.createdAt).getTime() < next).reduce((s, o) => s + o.total, 0));
      labels.push(day.toLocaleDateString("en-US", { month: "short", day: "numeric" }));
    }

    // revenue by tier (across all time)
    const tierMap = new Map<string, { label: string; value: number; color: string }>();
    let ti = 0;
    for (const e of db.events) {
      for (const t of e.tickets) {
        const rev = db.orders.filter((o) => o.eventId === e.id && o.status !== "refunded").reduce((s, o) => s + o.items.filter((i) => i.ticketId === t.id).reduce((x, i) => x + i.unit * i.qty, 0), 0);
        if (rev > 0) tierMap.set(t.id, { label: `${t.name} · ${e.name.split(" ")[0]}`, value: rev, color: TIER_COLORS[ti % TIER_COLORS.length] });
        ti += 1;
      }
    }
    const tiers = [...tierMap.values()].sort((a, b) => b.value - a.value).slice(0, 5);

    const promos = db.events.flatMap((e) => e.promos.map((p) => ({ p, e }))).filter((x) => x.p.used > 0).sort((a, b) => b.p.used - a.p.used);

    return { gross, refunded, tickets, avg, fees, tax, daily, labels, tiers, promos, orders };
  }, [db, range]);

  const grossAnim = useCountUp(data.gross);
  const ticketsAnim = useCountUp(data.tickets);

  const exportReport = () => {
    const rows: Array<Array<string | number>> = [["Date", "Orders", "Tickets", "Gross", "Refunded"]];
    data.daily.forEach((v, i) => {
      const dayOrders = data.orders.filter((o) => {
        const day = new Date();
        day.setHours(0, 0, 0, 0);
        day.setDate(day.getDate() - (data.daily.length - 1 - i));
        const t = new Date(o.createdAt).getTime();
        return t >= day.getTime() && t < day.getTime() + 86400000;
      });
      rows.push([data.labels[i], dayOrders.length, dayOrders.reduce((s, o) => s + o.items.reduce((x, it) => x + it.qty, 0), 0), v.toFixed(2), dayOrders.filter((o) => o.status === "refunded").reduce((s, o) => s + o.total, 0).toFixed(2)]);
    });
    downloadFile(`stubhaus-report-${range}d.csv`, toCSV(rows));
    toast({ kind: "ok", title: "Report exported", desc: `${range}-day daily breakdown → CSV` });
  };

  const tierTotal = data.tiers.reduce((s, t) => s + t.value, 0);

  return (
    <div className="mx-auto max-w-[1200px] space-y-5 px-5 pb-16 pt-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[28px] font-bold tracking-tight">Reports</h1>
          <p className="text-[13.5px] text-mut">Sales & revenue across all events</p>
        </div>
        <div className="flex items-center gap-2.5">
          <Segmented options={[{ value: "7", label: "7d" }, { value: "14", label: "14d" }, { value: "30", label: "30d" }]} value={range} onChange={setRange} />
          {can("export") && <Button variant="outline" onClick={exportReport}><IDownload size={14} /> Export</Button>}
        </div>
      </div>

      {/* KPIs */}
      <Reveal>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { label: "Gross revenue", v: money(grossAnim, cur), sub: "incl. fees & tax" },
            { label: "Tickets sold", v: num(Math.round(ticketsAnim)), sub: `${data.orders.filter((o) => o.status !== "refunded").length} orders` },
            { label: "Avg. order value", v: money(data.avg, cur), sub: "per paid order" },
            { label: "Refunded", v: money(data.refunded, cur), sub: data.refunded > 0 ? `${((data.refunded / (data.gross + data.refunded)) * 100).toFixed(1)}% of gross` : "clean slate" },
          ].map((k) => (
            <Card key={k.label} className="p-5">
              <p className="text-[11px] font-bold uppercase tracking-widest text-faint">{k.label}</p>
              <p className="tabular mt-2 font-display text-[26px] font-bold leading-none tracking-tight">{k.v}</p>
              <p className="mt-1.5 text-[11.5px] text-mut">{k.sub}</p>
            </Card>
          ))}
        </div>
      </Reveal>

      <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <Reveal>
          <Card className="p-5">
            <div className="mb-4 flex items-baseline justify-between">
              <h2 className="font-display text-[17px] font-bold tracking-tight">Daily gross revenue</h2>
              <span className="code-pill text-[11.5px] text-mut">{money(data.gross, cur)} total</span>
            </div>
            <Bars data={data.daily} labels={data.labels} height={190} color="var(--color-flame)" moneyFn={(n) => money(n, cur)} />
            <div className="mt-2 flex justify-between text-[10.5px] font-medium uppercase tracking-wider text-faint">
              <span>{data.labels[0]}</span><span>{data.labels[data.labels.length - 1]}</span>
            </div>
          </Card>
        </Reveal>

        <Reveal delay={80}>
          <Card className="p-5">
            <h2 className="mb-4 font-display text-[17px] font-bold tracking-tight">Revenue by tier</h2>
            <div className="flex items-center gap-5">
              <Donut segments={data.tiers} centerLabel={money(tierTotal, cur)} centerSub="all time" />
              <div className="min-w-0 flex-1 space-y-2">
                {data.tiers.map((t) => (
                  <div key={t.label} className="flex items-center gap-2 text-[12.5px]">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-[3px]" style={{ background: t.color }} />
                    <span className="truncate font-medium text-ink2">{t.label}</span>
                    <span className="code-pill ml-auto shrink-0 text-[11.5px] text-mut">{Math.round((t.value / (tierTotal || 1)) * 100)}%</span>
                  </div>
                ))}
                {data.tiers.length === 0 && <p className="text-[12.5px] text-mut">No sales yet.</p>}
              </div>
            </div>
            <div className="perf-x my-4" />
            <div className="grid grid-cols-2 gap-3 text-[12.5px]">
              <div><p className="text-faint">Fees collected</p><p className="code-pill mt-0.5 font-bold">{money(data.fees, cur)}</p></div>
              <div><p className="text-faint">Tax collected</p><p className="code-pill mt-0.5 font-bold">{money(data.tax, cur)}</p></div>
            </div>
          </Card>
        </Reveal>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_1.4fr]">
        {/* promo usage */}
        <Reveal>
          <Card className="p-5">
            <h2 className="mb-4 font-display text-[17px] font-bold tracking-tight">Promo performance</h2>
            <div className="space-y-3.5">
              {data.promos.map(({ p, e }) => (
                <HBar key={p.id} label={`${p.code} — ${e.name.split("—")[0].trim()}`} value={p.used} max={data.promos[0]?.p.used ?? 1} color="var(--color-flame)" display={`${p.used}/${p.limit} · ${p.kind === "percent" ? `${p.value}%` : money(p.value, cur)}`} />
              ))}
              {data.promos.length === 0 && <p className="text-[13px] text-mut">No codes redeemed yet.</p>}
            </div>
          </Card>
        </Reveal>

        {/* per-event table */}
        <Reveal delay={80}>
          <Card className="overflow-hidden">
            <div className="border-b border-line px-5 py-3.5">
              <h2 className="font-display text-[17px] font-bold tracking-tight">By event</h2>
            </div>
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="code-pill border-b border-line text-[10.5px] uppercase tracking-widest text-faint">
                  <th className="px-5 py-2.5 font-semibold">Event</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Tickets</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Gross</th>
                  <th className="px-5 py-2.5 text-right font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {db.events.map((e) => (
                  <tr key={e.id} className="transition-colors hover:bg-white/70">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <span className="h-7 w-1.5 rounded-full" style={{ background: e.accent }} />
                        <span className="flex items-center gap-2 font-semibold">{e.name.length > 28 ? e.name.slice(0, 28) + "…" : e.name} <ITicket size={12} className="text-faint" /></span>
                      </div>
                    </td>
                    <td className="code-pill px-4 py-3 text-right">{num(eventSold(e))}</td>
                    <td className="code-pill px-4 py-3 text-right font-bold">{money(eventRevenue(db.orders, e.id), cur)}</td>
                    <td className="px-5 py-3 text-right"><StatusPill status={e.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </Reveal>
      </div>
    </div>
  );
}
