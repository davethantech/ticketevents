import { useEffect, useMemo, useRef, useState } from "react";
import { AppProvider, useApp } from "./lib/store";
import { cx } from "./lib/utils";
import { Avatar, Badge, ToastProvider, useToast } from "./components/ui";
import { LogoMark, IGrid, IChart, ITicket, IUsers, IScan, IMail, IGlobe, IShield, IKey, IGear, IServer, ISearch, IPlus, IChevronD, ICheck, IWallet, IBox } from "./components/icons";
import Dashboard from "./views/Dashboard";
import Reports from "./views/Reports";
import { EventsList, EventEditor, CreateEventModal } from "./views/Events";
import PublicEvent from "./views/PublicEvent";
import WidgetSetup from "./views/Widget";
import { OrdersView, AttendeesView } from "./views/OrdersAttendees";
import CheckIn from "./views/CheckIn";
import { TeamView, MessagesView, ApiPage, SelfHostView, SettingsView } from "./views/Platform";

/* ---------------- router ---------------- */

function useHashRoute(): string {
  const [hash, setHash] = useState(() => window.location.hash || "#/");
  useEffect(() => {
    const onHash = () => setHash(window.location.hash || "#/");
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  return hash.replace(/^#/, "") || "/";
}

const navigate = (to: string) => {
  window.location.hash = to;
  window.scrollTo({ top: 0 });
};

/* ---------------- nav model ---------------- */

const NAV = [
  {
    label: "Overview",
    items: [
      { to: "/", label: "Dashboard", icon: IGrid },
      { to: "/reports", label: "Reports", icon: IChart },
    ],
  },
  {
    label: "Manage",
    items: [
      { to: "/events", label: "Events", icon: ITicket },
      { to: "/orders", label: "Orders", icon: IWallet },
      { to: "/attendees", label: "Attendees", icon: IUsers },
      { to: "/checkin", label: "Check-in", icon: IScan },
      { to: "/messages", label: "Messages", icon: IMail },
      { to: "/widget", label: "Embed widget", icon: IGlobe },
    ],
  },
  {
    label: "Platform",
    items: [
      { to: "/team", label: "Team", icon: IShield },
      { to: "/api", label: "API", icon: IKey },
      { to: "/settings", label: "Settings", icon: IGear },
      { to: "/selfhost", label: "Self-host", icon: IServer },
    ],
  },
];

const TITLES: Array<[string, string]> = [
  ["/events", "Events"], ["/orders", "Orders"], ["/attendees", "Attendees"], ["/checkin", "Check-in"],
  ["/messages", "Messages"], ["/widget", "Embed widget"], ["/team", "Team"], ["/api", "API"],
  ["/settings", "Settings"], ["/selfhost", "Self-hosting"], ["/reports", "Reports"],
];

/* ---------------- shell ---------------- */

function Shell() {
  const { db, user, api } = useApp();
  const toast = useToast();
  const route = useHashRoute();
  const [pathRaw, queryRaw] = route.split("?");
  const path = pathRaw || "/";
  const seg = path.split("/").filter(Boolean);
  const [creating, setCreating] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const [q, setQ] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return { events: [], people: [] as typeof db.attendees };
    return {
      events: db.events.filter((e) => e.name.toLowerCase().includes(needle)).slice(0, 4),
      people: db.attendees.filter((a) => [a.name, a.email, a.code].some((s) => s.toLowerCase().includes(needle))).slice(0, 5),
    };
  }, [q, db]);

  // full-bleed routes without the organizer chrome
  if (seg[0] === "embed") {
    return (
      <div className="min-h-screen bg-bg">
        <PublicEvent slug={seg[1] ?? ""} embedded />
      </div>
    );
  }
  if (seg[0] === "page") {
    return (
      <div className="min-h-screen bg-bg">
        <PublicEvent slug={seg[1] ?? ""} onNavigateHome={() => navigate("/")} />
      </div>
    );
  }

  const title = TITLES.find(([p]) => path === p || path.startsWith(p + "/"))?.[1] ?? (seg[0] === "" ? "Dashboard" : "Stubhaus");
  const isActive = (to: string) => (to === "/" ? path === "/" : path === to || path.startsWith(to + "/"));

  return (
    <div className="flex min-h-screen">
      {/* sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[228px] flex-col border-r border-nightline bg-night text-[#e7eae4] lg:flex">
        <button onClick={() => navigate("/")} className="focus-ring flex items-center gap-2.5 px-5 pb-5 pt-6 text-left">
          <LogoMark size={30} />
          <span>
            <span className="block font-display text-[17px] font-bold leading-none tracking-tight text-white">Stubhaus</span>
            <span className="code-pill mt-0.5 block text-[9.5px] uppercase tracking-[0.18em] text-[#8d968e]">self-hosted ticketing</span>
          </span>
        </button>

        <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-4">
          {NAV.map((g) => (
            <div key={g.label}>
              <p className="code-pill px-2.5 pb-1.5 text-[9.5px] uppercase tracking-[0.18em] text-[#5f6a62]">{g.label}</p>
              <div className="space-y-0.5">
                {g.items.map((it) => {
                  const Icon = it.icon;
                  const active = isActive(it.to);
                  return (
                    <button
                      key={it.to}
                      onClick={() => navigate(it.to)}
                      className={cx(
                        "focus-ring group relative flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-semibold transition-all duration-150",
                        active ? "bg-night2 text-white" : "text-[#9aa29a] hover:bg-night2/60 hover:text-white",
                      )}
                    >
                      {active && <span className="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-r bg-flame" />}
                      <Icon size={16} className={cx("transition-colors", active ? "text-flame2" : "text-[#5f6a62] group-hover:text-[#9aa29a]")} />
                      {it.label}
                      {it.to === "/checkin" && db.events.some((e) => e.status === "live") && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-flame blinker" />}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-nightline p-3">
          <button onClick={() => navigate("/selfhost")} className="focus-ring stripe-hatch-dark group flex w-full items-center gap-2.5 rounded-lg bg-night2 px-3 py-2.5 text-left transition-colors hover:bg-night3">
            <IBox size={16} className="text-teal2" />
            <span className="flex-1">
              <span className="block text-[12px] font-bold text-white">Runs on your box</span>
              <span className="block text-[10.5px] text-[#8d968e]">v1.4.2 · docker · healthy</span>
            </span>
            <span className="h-2 w-2 rounded-full bg-ok" />
          </button>
        </div>
      </aside>

      {/* main */}
      <div className="min-w-0 flex-1 lg:pl-[228px]">
        {/* topbar */}
        <header className="sticky top-0 z-30 border-b border-line bg-bg/85 backdrop-blur">
          <div className="flex items-center gap-3 px-5 py-3 lg:px-8">
            <button onClick={() => navigate("/")} className="focus-ring lg:hidden"><LogoMark size={26} /></button>
            <p className="code-pill hidden text-[11px] uppercase tracking-widest text-faint sm:block">{db.settings.org}</p>
            <span className="hidden text-line2 sm:block">/</span>
            <h2 className="font-display text-[15px] font-bold tracking-tight">{title}</h2>

            {/* search */}
            <div ref={searchRef} className="relative ml-auto w-full max-w-[300px]">
              <ISearch size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
              <input
                value={q}
                onChange={(e) => { setQ(e.target.value); setSearchOpen(true); }}
                onFocus={() => setSearchOpen(true)}
                placeholder="Search events, people, codes…"
                className="focus-ring h-9 w-full rounded-lg border border-line2 bg-white pl-8.5 pl-9 pr-3 text-[12.5px] placeholder:text-faint"
              />
              {searchOpen && q.trim() && (
                <div className="pop-in absolute left-0 right-0 top-11 overflow-hidden rounded-xl border border-line bg-paper shadow-[var(--shadow-pop)]">
                  {results.events.length === 0 && results.people.length === 0 && <p className="px-4 py-3 text-[12.5px] text-mut">No matches for “{q}”.</p>}
                  {results.events.map((e) => (
                    <button key={e.id} onClick={() => { navigate(`/events/${e.id}`); setQ(""); setSearchOpen(false); }} className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left transition-colors hover:bg-white">
                      <span className="h-6 w-6 shrink-0 overflow-hidden rounded-md"><img src={e.cover} alt="" className="h-full w-full object-cover" /></span>
                      <span className="truncate text-[13px] font-semibold">{e.name}</span>
                      <Badge className="ml-auto shrink-0">{e.status}</Badge>
                    </button>
                  ))}
                  {results.people.map((a) => (
                    <button key={a.id} onClick={() => { navigate(`/attendees`); setQ(""); setSearchOpen(false); }} className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left transition-colors hover:bg-white">
                      <Avatar name={a.name} color="#0e6b60" size={24} />
                      <span className="min-w-0">
                        <span className="block truncate text-[13px] font-semibold leading-tight">{a.name}</span>
                        <span className="code-pill block text-[10.5px] text-mut">{a.code} · {a.ticketName}</span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* new event */}
            <ButtonTopBar onClick={() => setCreating(true)} />

            {/* user switcher */}
            <div className="relative">
              <button onClick={() => setUserMenu(!userMenu)} className="focus-ring flex items-center gap-2 rounded-lg border border-line bg-white py-1 pl-1 pr-2 transition-colors hover:border-faint">
                <Avatar name={user.name} color={user.color} size={28} />
                <span className="hidden text-left sm:block">
                  <span className="block text-[12px] font-bold leading-tight">{user.name.split(" ")[0]}</span>
                  <span className="code-pill block text-[9.5px] uppercase tracking-wider text-faint">{user.role}</span>
                </span>
                <IChevronD size={13} className={cx("text-faint transition-transform", userMenu && "rotate-180")} />
              </button>
              {userMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setUserMenu(false)} />
                  <div className="pop-in absolute right-0 top-12 z-50 w-60 overflow-hidden rounded-xl border border-line bg-paper shadow-[var(--shadow-pop)]">
                    <p className="code-pill border-b border-line px-3.5 py-2 text-[10px] uppercase tracking-widest text-faint">Switch user (demo)</p>
                    {db.users.filter((u) => u.status === "active").map((u) => (
                      <button key={u.id} onClick={() => { api.switchUser(u.id); setUserMenu(false); toast({ kind: "info", title: `Acting as ${u.name}`, desc: `${u.role} permissions applied.` }); }} className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left transition-colors hover:bg-white">
                        <Avatar name={u.name} color={u.color} size={26} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[12.5px] font-bold leading-tight">{u.name}</span>
                          <span className="block text-[10.5px] capitalize text-mut">{u.role}</span>
                        </span>
                        {u.id === user.id && <ICheck size={14} className="text-flame" />}
                      </button>
                    ))}
                    <button onClick={() => { navigate("/team"); setUserMenu(false); }} className="block w-full border-t border-line px-3.5 py-2.5 text-left text-[12px] font-semibold text-teal transition-colors hover:bg-tealdim">Manage team & roles</button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* mobile nav */}
          <nav className="flex gap-1 overflow-x-auto px-4 pb-2 lg:hidden">
            {NAV.flatMap((g) => g.items).map((it) => (
              <button key={it.to} onClick={() => navigate(it.to)} className={cx("focus-ring flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-semibold transition-colors", isActive(it.to) ? "border-flame bg-flamedim text-flame" : "border-line bg-white text-mut")}>
                <it.icon size={13} />{it.label}
              </button>
            ))}
          </nav>
        </header>

        <main key={route} className="page-in">
          {path === "/" && <Dashboard navigate={navigate} />}
          {path === "/events" && <EventsList navigate={navigate} />}
          {seg[0] === "events" && seg[1] && <EventEditor id={seg[1]} tab={seg[2] ?? "details"} navigate={navigate} />}
          {path === "/orders" && <OrdersView />}
          {path === "/attendees" && <AttendeesView />}
          {path === "/checkin" && <CheckIn initialEventId={new URLSearchParams(queryRaw ?? "").get("event") ?? undefined} />}
          {path === "/reports" && <Reports />}
          {path === "/messages" && <MessagesView navigate={navigate} />}
          {path === "/widget" && <WidgetSetup />}
          {path === "/team" && <TeamView />}
          {path === "/api" && <ApiPage />}
          {path === "/settings" && <SettingsView />}
          {path === "/selfhost" && <SelfHostView />}
          {!["/", "/events", "/orders", "/attendees", "/checkin", "/reports", "/messages", "/widget", "/team", "/api", "/settings", "/selfhost"].includes(path) && seg[0] !== "events" && (
            <div className="px-5 pt-16 text-center">
              <p className="font-display text-[22px] font-bold">Page not found</p>
              <p className="mt-1 text-[13.5px] text-mut">That route doesn't exist in this workspace.</p>
            </div>
          )}
        </main>
      </div>

      <CreateEventModal open={creating} onClose={() => setCreating(false)} onCreated={(id) => { setCreating(false); navigate(`/events/${id}`); }} />
    </div>
  );
}

function ButtonTopBar({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="focus-ring hidden h-9 shrink-0 items-center gap-1.5 rounded-lg bg-flame px-3.5 text-[13px] font-bold text-white shadow-[0_2px_0_rgb(150_35_10)] transition-all hover:bg-[#d63a17] active:scale-[0.97] sm:inline-flex">
      <IPlus size={14} /> New event
    </button>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppProvider>
        <Shell />
      </AppProvider>
    </ToastProvider>
  );
}
