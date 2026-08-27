import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type {
  AddOn, ApiKey, Attendee, CheckoutSettings, DB, EventItem, EventType, Message, Order,
  OrderAddOn, OrderItem, PromoCode, Question, Role, ScanEntry, ScanResult, Settings,
  TicketType, Totals, User,
} from "./types";
import { apiKey, isoDaysAgo, isoInDays, mulberry32, orderNumber, pick, rint, slugify, ticketCode, uid } from "./utils";

export const SEED_VERSION = 4;
const LS_KEY = "stubhaus:db";

export const COVERS: Record<EventType, string> = {
  conference: "https://image.qwenlm.ai/generated-images/bda9984e-d8fd-44f5-8315-bd523afd9cf3/_result.png",
  concert: "https://image.qwenlm.ai/generated-images/0e3cfdee-f73c-4830-98e5-442c04c1c7a1/_result.png",
  workshop: "https://image.qwenlm.ai/generated-images/acd2bbf2-8190-4978-b27f-0ed41ad866bf/_result.png",
  festival: "https://image.qwenlm.ai/generated-images/636d9b3c-d98a-4c4b-b152-ea119a970c9d/_result.png",
};

export const TYPE_ACCENT: Record<EventType, string> = {
  conference: "#e8431f",
  concert: "#0e6b60",
  workshop: "#a86a14",
  festival: "#b03a64",
};

export const TYPE_LABEL: Record<EventType, string> = {
  conference: "Conference",
  concert: "Concert",
  workshop: "Workshop",
  festival: "Festival",
};

const FIRST = ["Maya", "Jonas", "Priya", "Devon", "Ines", "Kai", "Sofia", "Marcus", "Amara", "Theo", "Nadia", "Felix", "Zoe", "Omar", "Elsa", "Ruben", "Tessa", "Hugo", "Ivy", "Andre", "Lena", "Mateo", "Clara", "Yusuf", "Greta", "Paulo", "Hana", "Oscar", "Rhea", "Dmitri"];
const LAST = ["Solis", "Okafor", "Nair", "Whitaker", "Berg", "Tanaka", "Reyes", "Lindqvist", "Moreau", "Kowalski", "Haddad", "Petrov", "Nguyen", "Castillo", "Brandt", "Iversen", "Osei", "Marchetti", "Duval", "Sato", "Keller", "Vargas", "Holm", "Ferreira", "Adeyemi", "Novak", "Larsson", "Costa", "Byrne", "Malik"];
const COMPANIES = ["Hexworks", "Datawheel", "Copperline", "Northbeam", "Studio Karst", "Fieldnote", "Parcello", "Arcline", "Mosaic Labs", "Tenderfoot", "Bluegrain", "Quill & Co", "Ferrous", "Halide", "Wrenworks"];
const DIETS = ["No restrictions", "Vegetarian", "Vegan", "Gluten-free"];

function computeTotals(settings: Settings, subtotal: number, ticketCount: number, promo?: PromoCode): Totals {
  let discount = 0;
  if (promo) discount = promo.kind === "percent" ? (subtotal * promo.value) / 100 : Math.min(promo.value, subtotal);
  discount = Math.round(discount * 100) / 100;
  const afterDiscount = subtotal - discount;
  const fees = Math.round((afterDiscount * (settings.feePercent / 100) + settings.feeFixed * ticketCount) * 100) / 100;
  const tax = Math.round((afterDiscount + fees) * (settings.taxRate / 100) * 100) / 100;
  const total = Math.round((afterDiscount + fees + tax) * 100) / 100;
  return { subtotal, discount, fees, tax, total };
}

/* ------------------------------------------------------------------ */
/* Seed                                                                */
/* ------------------------------------------------------------------ */

function baseEvent(partial: Partial<EventItem> & Pick<EventItem, "id" | "slug" | "name" | "type" | "status" | "start" | "end" | "venue" | "city">): EventItem {
  return {
    description: "",
    cover: COVERS[partial.type],
    accent: TYPE_ACCENT[partial.type],
    tickets: [],
    addOns: [],
    promos: [],
    questions: [],
    checkout: {
      buttonLabel: "Get tickets",
      note: "",
      requireEmail: true,
      collectCompany: false,
      allowPromos: true,
    },
    ...partial,
  };
}

function seedDB(): DB {
  const rng = mulberry32(20260214);
  const settings: Settings = {
    org: "Fathom Events Co.",
    currency: "USD",
    taxRate: 8.25,
    feePercent: 3.5,
    feeFixed: 1.25,
    email: "tickets@fathom.events",
    smtpHost: "smtp.fathom.events",
    domain: "tickets.fathom.events",
  };

  const users: User[] = [
    { id: "u-mira", name: "Mira Solis", email: "mira@fathom.events", role: "owner", status: "active", color: "#e8431f" },
    { id: "u-devon", name: "Devon Okafor", email: "devon@fathom.events", role: "admin", status: "active", color: "#0e6b60" },
    { id: "u-priya", name: "Priya Nair", email: "priya@fathom.events", role: "staff", status: "active", color: "#a86a14" },
    { id: "u-sam", name: "Sam Whitaker", email: "sam@fathom.events", role: "scanner", status: "active", color: "#5b5bd6" },
    { id: "u-lena", name: "Lena Vogt", email: "lena@fathom.events", role: "staff", status: "invited", color: "#b03a64" },
  ];

  const summit = baseEvent({
    id: "ev-summit", slug: "northloop-dev-summit-26", name: "Northloop Dev Summit '26", type: "conference", status: "live",
    start: isoInDays(34, 9), end: isoInDays(35, 18), venue: "The Foundry Hall", city: "Austin, TX",
    description: "Two days of deep-dive talks, hands-on labs and hallway tracks for people who build for the web. 40+ speakers, zero fluff, one very good coffee cart.",
    tickets: [
      { id: "t-sum-eb", name: "Early Bird", description: "Full access, ends soon", price: 249, capacity: 300, sold: 0, active: true },
      { id: "t-sum-std", name: "Standard", description: "Full two-day access", price: 349, capacity: 500, sold: 0, active: true },
      { id: "t-sum-vip", name: "VIP", description: "Front rows + speaker dinner", price: 599, capacity: 100, sold: 0, active: true },
    ],
    addOns: [
      { id: "a-sum-ws", name: "Lab Day Pass", description: "Hands-on labs, day 2", price: 79, active: true },
      { id: "a-sum-tee", name: "Summit Tee", description: "Heavyweight cotton, sizes S–XXL", price: 25, active: true },
      { id: "a-sum-party", name: "Afterparty", description: "Rooftop, drinks included", price: 40, active: true },
    ],
    promos: [
      { id: "p-sum-1", code: "EARLYBIRD", kind: "percent", value: 20, limit: 200, used: 0, active: true },
      { id: "p-sum-2", code: "TEAM10", kind: "fixed", value: 10, limit: 500, used: 0, active: true },
    ],
    questions: [
      { id: "q-sum-1", label: "Company / team", type: "text", required: true },
      { id: "q-sum-2", label: "Dietary preference", type: "select", required: false, options: DIETS },
      { id: "q-sum-3", label: "Attending the networking dinner?", type: "checkbox", required: false },
    ],
    checkout: { buttonLabel: "Reserve my seat", note: "Student? Email tickets@fathom.events with your ID for 30% off.", requireEmail: true, collectCompany: false, allowPromos: true },
  });

  const concert = baseEvent({
    id: "ev-concert", slug: "maya-reine-neon-coast", name: "Maya Reine — Neon Coast Live", type: "concert", status: "live",
    start: isoInDays(0, 20), end: isoInDays(0, 23), venue: "Harbor Amphitheater", city: "San Diego, CA",
    description: "One night. Full band, full strings, the whole Neon Coast record front to back — plus a few songs that have never left the demo folder.",
    tickets: [
      { id: "t-con-ga", name: "General Admission", description: "Standing lawn", price: 59, capacity: 800, sold: 0, active: true },
      { id: "t-con-vip", name: "VIP Pit", description: "Front pit + merch bundle", price: 149, capacity: 150, sold: 0, active: true },
    ],
    addOns: [
      { id: "a-con-park", name: "Parking", description: "Lot C, pre-paid", price: 18, active: true },
      { id: "a-con-poster", name: "Signed Poster", description: "Pick up at merch", price: 30, active: true },
    ],
    promos: [{ id: "p-con-1", code: "COAST15", kind: "percent", value: 15, limit: 100, used: 0, active: true }],
    checkout: { buttonLabel: "Get tickets", note: "Doors 7pm. Clear bag policy in effect.", requireEmail: true, collectCompany: false, allowPromos: true },
  });

  const workshop = baseEvent({
    id: "ev-workshop", slug: "sourdough-bake-day", name: "Hands-on Sourdough: Bake Day", type: "workshop", status: "ended",
    start: isoInDays(-6, 10), end: isoInDays(-6, 14), venue: "Crumb & Co. Studio", city: "Portland, OR",
    description: "Four hours, flour everywhere. Mix, shape, score and bake a loaf you'll actually be proud of. All levels welcome — aprons and starters provided.",
    tickets: [{ id: "t-ws-seat", name: "Maker Seat", description: "Includes starter jar to take home", price: 85, capacity: 18, sold: 0, active: true }],
    addOns: [{ id: "a-ws-jar", name: "Extra Starter Jar", description: "For a friend", price: 12, active: true }],
    promos: [],
    questions: [
      { id: "q-ws-1", label: "Baking experience", type: "select", required: true, options: ["Brand new", "Some", "Seasoned"] },
      { id: "q-ws-2", label: "Allergies we should know about", type: "text", required: false },
    ],
    checkout: { buttonLabel: "Book a seat", note: "Max 18 seats — we like it crowded around the ovens, not the room.", requireEmail: true, collectCompany: false, allowPromos: false },
  });

  const festival = baseEvent({
    id: "ev-festival", slug: "wavelength-festival", name: "Wavelength Festival", type: "festival", status: "draft",
    start: isoInDays(118, 12), end: isoInDays(120, 23), venue: "Meridian Park", city: "Lisbon, PT",
    description: "Three days, four stages, one park by the water. Lineup drops soon — get on the list and lock a pass before prices climb.",
    tickets: [
      { id: "t-fes-3d", name: "3-Day Pass", description: "All stages, all days", price: 199, capacity: 4000, sold: 0, active: true },
      { id: "t-fes-camp", name: "3-Day + Camping", description: "Includes campsite & showers", price: 289, capacity: 1500, sold: 0, active: true },
    ],
    addOns: [{ id: "a-fes-shuttle", name: "City Shuttle", description: "Unlimited rides, 3 days", price: 22, active: true }],
    promos: [],
    checkout: { buttonLabel: "Lock my pass", note: "", requireEmail: true, collectCompany: false, allowPromos: true },
  });

  const events: EventItem[] = [concert, summit, workshop, festival];
  const orders: Order[] = [];
  const attendees: Attendee[] = [];
  const scans: ScanEntry[] = [];

  function genOrders(ev: EventItem, targets: Record<string, number>, opts: { daysBack: number; promo?: PromoCode; promoRate?: number; answersFor: () => Record<string, string> }) {
    const remaining = { ...targets };
    let guard = 0;
    while (Object.values(remaining).some((n) => n > 0) && guard < 4000) {
      guard += 1;
      const eligible = ev.tickets.filter((t) => (remaining[t.id] ?? 0) > 0);
      if (eligible.length === 0) break;
      const t = pick(rng, eligible);
      const qty = Math.min(rint(rng, 1, t.id.includes("vip") ? 2 : 3), remaining[t.id]);
      remaining[t.id] -= qty;
      const ticket = ev.tickets.find((x) => x.id === t.id)!;
      ticket.sold += qty;

      const addOnRows: OrderAddOn[] = [];
      for (const a of ev.addOns) {
        if (rng() < 0.18) addOnRows.push({ addOnId: a.id, name: a.name, qty: rint(rng, 1, 2), unit: a.price });
      }
      const usedPromo = opts.promo && rng() < (opts.promoRate ?? 0.2) ? opts.promo : undefined;
      if (usedPromo) usedPromo.used += 1;

      const subtotal = ticket.price * qty + addOnRows.reduce((s, a) => s + a.unit * a.qty, 0);
      const totals = computeTotals(settings, subtotal, qty, usedPromo);
      const createdAt = isoDaysAgo(rint(rng, 0, opts.daysBack), 0, rng);
      const first = pick(rng, FIRST);
      const last = pick(rng, LAST);
      const company = pick(rng, COMPANIES);
      const items: OrderItem[] = [{ ticketId: t.id, name: t.name, qty, unit: t.price }];
      const order: Order = {
        id: uid(), number: orderNumber(), eventId: ev.id, eventName: ev.name,
        buyer: { name: `${first} ${last}`, email: `${first}.${last}`.toLowerCase() + "@" + (rng() < 0.5 ? company.replace(/[^a-z]+/gi, "").toLowerCase() + ".com" : "postbox.io"), company: rng() < 0.6 ? company : undefined },
        items, addOns: addOnRows, promo: usedPromo?.code, ...totals,
        status: totals.total > 0 ? "paid" : "free", method: totals.total > 0 ? "card" : "free", createdAt,
      };
      orders.push(order);

      const answersPool = opts.answersFor();
      for (let i = 0; i < qty; i += 1) {
        const aName = i === 0 ? order.buyer.name : `${pick(rng, FIRST)} ${last}`;
        attendees.push({
          id: uid(), orderId: order.id, orderNumber: order.number, eventId: ev.id, eventName: ev.name,
          ticketId: t.id, ticketName: t.name, name: aName,
          email: i === 0 ? order.buyer.email : `${aName.replace(" ", ".").toLowerCase()}@postbox.io`,
          code: ticketCode(), answers: { ...answersPool }, createdAt,
        });
      }
    }
  }

  genOrders(summit, { "t-sum-eb": 212, "t-sum-std": 163, "t-sum-vip": 57 }, {
    daysBack: 30, promo: summit.promos[0], promoRate: 0.22,
    answersFor: () => ({
      "q-sum-1": pick(rng, COMPANIES),
      "q-sum-2": pick(rng, DIETS),
      "q-sum-3": rng() < 0.55 ? "Yes" : "",
    }),
  });

  genOrders(concert, { "t-con-ga": 342, "t-con-vip": 96 }, {
    daysBack: 24, promo: concert.promos[0], promoRate: 0.16,
    answersFor: () => ({}),
  });

  genOrders(workshop, { "t-ws-seat": 14 }, {
    daysBack: 12,
    answersFor: () => ({
      "q-ws-1": pick(rng, ["Brand new", "Some", "Seasoned"]),
      "q-ws-2": rng() < 0.2 ? "Tree nut allergy" : "",
    }),
  });

  // Check-ins: workshop fully checked in, concert ~35% in the last hours.
  for (const a of attendees) {
    if (a.eventId === "ev-workshop") {
      const at = isoDaysAgo(6, 0, rng);
      a.checkedInAt = at;
      scans.push({ id: uid(), code: a.code, eventId: a.eventId, eventName: a.eventName, result: "ok", attendee: a.name, by: "Gate A · Priya", at });
    } else if (a.eventId === "ev-concert" && rng() < 0.35) {
      const minsAgo = rint(rng, 2, 130);
      const at = new Date(Date.now() - minsAgo * 60000).toISOString();
      a.checkedInAt = at;
      scans.push({ id: uid(), code: a.code, eventId: a.eventId, eventName: a.eventName, result: "ok", attendee: a.name, by: pick(rng, ["Gate 1 · Sam", "Gate 2 · Sam", "VIP lane · Devon"]), at });
    }
  }
  // A few messy scans for realism.
  scans.push({ id: uid(), code: "BADSCAN1", eventId: "ev-concert", eventName: concert.name, result: "invalid", by: "Gate 1 · Sam", at: new Date(Date.now() - 40 * 60000).toISOString() });
  const dup = attendees.find((a) => a.eventId === "ev-concert" && a.checkedInAt);
  if (dup) scans.push({ id: uid(), code: dup.code, eventId: "ev-concert", eventName: concert.name, result: "duplicate", attendee: dup.name, by: "Gate 2 · Sam", at: new Date(Date.now() - 12 * 60000).toISOString() });
  scans.sort((x, y) => (x.at < y.at ? 1 : -1));

  const messages: Message[] = [
    { id: uid(), eventId: "ev-concert", eventName: concert.name, audience: "All ticket holders", subject: "Doors, parking & the clear-bag rule", body: "Doors at 7pm, Lot C parking is $18 if you didn't pre-pay. Quick reminder: clear bags only, 12×6×12 max. See you at the water.", recipients: attendees.filter((a) => a.eventId === "ev-concert").length, at: isoDaysAgo(1, 0, rng), by: "Devon Okafor" },
    { id: uid(), eventId: "ev-summit", eventName: summit.name, audience: "All ticket holders", subject: "Schedule v1 is live 🎉", body: "The first schedule draft is up — 40 sessions, 4 tracks. Talk ratings open next week. Lab Day passes are 60% gone, no pressure.", recipients: attendees.filter((a) => a.eventId === "ev-summit").length, at: isoDaysAgo(4, 0, rng), by: "Mira Solis" },
  ];

  const apiKeys: ApiKey[] = [
    { id: uid(), label: "Production website", key: "sk_live_" + "Tq8f2Hd91mZxVb4kQw0eRtY7uI", createdAt: isoDaysAgo(41, 0), lastUsed: isoDaysAgo(0, 0, rng) },
  ];

  return { version: SEED_VERSION, settings, users, currentUserId: "u-mira", events, orders, attendees, scans, messages, apiKeys };
}

function loadDB(): DB {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DB;
      if (parsed.version === SEED_VERSION) return parsed;
    }
  } catch {
    /* fall through to seed */
  }
  return seedDB();
}

/* ------------------------------------------------------------------ */
/* Context                                                             */
/* ------------------------------------------------------------------ */

const PERMS: Record<string, Role[]> = {
  refund: ["owner", "admin"],
  team: ["owner"],
  settings: ["owner", "admin"],
  edit: ["owner", "admin", "staff"],
  export: ["owner", "admin", "staff"],
  message: ["owner", "admin", "staff"],
  checkin: ["owner", "admin", "staff", "scanner"],
};

export interface PlaceOrderInput {
  items: Array<{ ticketId: string; qty: number }>;
  addOns: Array<{ addOnId: string; qty: number }>;
  promoCode?: string;
  buyer: { name: string; email: string; company?: string };
  answers: Record<string, string>;
}

export interface Api {
  saveSettings: (patch: Partial<Settings>) => void;
  switchUser: (id: string) => void;
  addMember: (m: { name: string; email: string; role: Role }) => void;
  updateMember: (id: string, patch: Partial<User>) => void;
  removeMember: (id: string) => void;
  createEvent: (input: { name: string; type: EventType; start: string }) => string;
  updateEvent: (id: string, patch: Partial<EventItem>) => void;
  deleteEvent: (id: string) => void;
  saveTicket: (eventId: string, ticket: TicketType) => void;
  removeTicket: (eventId: string, ticketId: string) => void;
  saveAddOn: (eventId: string, addOn: AddOn) => void;
  removeAddOn: (eventId: string, addOnId: string) => void;
  savePromo: (eventId: string, promo: PromoCode) => void;
  removePromo: (eventId: string, promoId: string) => void;
  saveQuestions: (eventId: string, questions: Question[]) => void;
  saveCheckout: (eventId: string, checkout: CheckoutSettings) => void;
  placeOrder: (eventId: string, input: PlaceOrderInput) => { ok: boolean; error?: string; order?: Order; attendees?: Attendee[] };
  refundOrder: (orderId: string) => void;
  checkIn: (eventId: string, code: string, by: string) => ScanEntry;
  undoCheckIn: (attendeeId: string, by: string) => void;
  sendMessage: (m: { eventId: string; audience: string; subject: string; body: string; recipients: number }) => void;
  addApiKey: (label: string) => ApiKey;
  revokeApiKey: (id: string) => void;
  resetDemo: () => void;
}

interface Ctx {
  db: DB;
  user: User;
  can: (perm: string) => boolean;
  api: Api;
  totals: (ev: EventItem, items: Array<{ ticketId: string; qty: number }>, addOns: Array<{ addOnId: string; qty: number }>, promo?: PromoCode) => Totals;
}

const AppCtx = createContext<Ctx | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<DB>(loadDB);

  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(db));
    } catch {
      /* storage full or unavailable — demo continues in memory */
    }
  }, [db]);

  const value = useMemo<Ctx>(() => {
    const user = db.users.find((u) => u.id === db.currentUserId) ?? db.users[0];
    const can = (perm: string) => (PERMS[perm] ?? []).includes(user.role);

    const patchEvent = (id: string, fn: (e: EventItem) => EventItem) =>
      setDb((d) => ({ ...d, events: d.events.map((e) => (e.id === id ? fn(e) : e)) }));

    const api: Api = {
      saveSettings: (patch) => setDb((d) => ({ ...d, settings: { ...d.settings, ...patch } })),
      switchUser: (id) => setDb((d) => ({ ...d, currentUserId: id })),
      addMember: (m) =>
        setDb((d) => ({
          ...d,
          users: [...d.users, { id: uid(), status: "invited" as const, color: pick(Math.random, ["#e8431f", "#0e6b60", "#a86a14", "#5b5bd6", "#b03a64"]), ...m }],
        })),
      updateMember: (id, patch) => setDb((d) => ({ ...d, users: d.users.map((u) => (u.id === id ? { ...u, ...patch } : u)) })),
      removeMember: (id) => setDb((d) => ({ ...d, users: d.users.filter((u) => u.id !== id) })),

      createEvent: ({ name, type, start }) => {
        const id = uid();
        const end = new Date(new Date(start).getTime() + 4 * 3600000).toISOString();
        const ev = baseEvent({
          id, slug: slugify(name) || id.slice(0, 8), name, type, status: "draft", start, end,
          venue: "Venue TBD", city: "City TBD",
          tickets: [{ id: uid(), name: type === "concert" ? "General Admission" : "Standard", description: "", price: type === "workshop" ? 49 : 39, capacity: 100, sold: 0, active: true }],
        });
        setDb((d) => ({ ...d, events: [ev, ...d.events] }));
        return id;
      },
      updateEvent: (id, patch) => patchEvent(id, (e) => ({ ...e, ...patch })),
      deleteEvent: (id) =>
        setDb((d) => ({
          ...d,
          events: d.events.filter((e) => e.id !== id),
          orders: d.orders.filter((o) => o.eventId !== id),
          attendees: d.attendees.filter((a) => a.eventId !== id),
          scans: d.scans.filter((s) => s.eventId !== id),
        })),

      saveTicket: (eventId, ticket) =>
        patchEvent(eventId, (e) => {
          const exists = e.tickets.some((t) => t.id === ticket.id);
          return { ...e, tickets: exists ? e.tickets.map((t) => (t.id === ticket.id ? ticket : t)) : [...e.tickets, ticket] };
        }),
      removeTicket: (eventId, ticketId) => patchEvent(eventId, (e) => ({ ...e, tickets: e.tickets.filter((t) => t.id !== ticketId) })),
      saveAddOn: (eventId, addOn) =>
        patchEvent(eventId, (e) => {
          const exists = e.addOns.some((a) => a.id === addOn.id);
          return { ...e, addOns: exists ? e.addOns.map((a) => (a.id === addOn.id ? addOn : a)) : [...e.addOns, addOn] };
        }),
      removeAddOn: (eventId, addOnId) => patchEvent(eventId, (e) => ({ ...e, addOns: e.addOns.filter((a) => a.id !== addOnId) })),
      savePromo: (eventId, promo) =>
        patchEvent(eventId, (e) => {
          const exists = e.promos.some((p) => p.id === promo.id);
          return { ...e, promos: exists ? e.promos.map((p) => (p.id === promo.id ? promo : p)) : [...e.promos, promo] };
        }),
      removePromo: (eventId, promoId) => patchEvent(eventId, (e) => ({ ...e, promos: e.promos.filter((p) => p.id !== promoId) })),
      saveQuestions: (eventId, questions) => patchEvent(eventId, (e) => ({ ...e, questions })),
      saveCheckout: (eventId, checkout) => patchEvent(eventId, (e) => ({ ...e, checkout })),

      placeOrder: (eventId, input) => {
        const ev = db.events.find((e) => e.id === eventId);
        if (!ev) return { ok: false, error: "Event not found" };
        for (const it of input.items) {
          const t = ev.tickets.find((x) => x.id === it.ticketId);
          if (!t) return { ok: false, error: "Unknown ticket type" };
          if (it.qty > t.capacity - t.sold) return { ok: false, error: `Only ${t.capacity - t.sold} left for ${t.name}` };
        }
        let promo: PromoCode | undefined;
        if (input.promoCode) {
          promo = ev.promos.find((p) => p.code.toLowerCase() === input.promoCode!.trim().toLowerCase() && p.active);
          if (!promo) return { ok: false, error: "That promo code isn't valid for this event" };
          if (promo.used >= promo.limit) return { ok: false, error: "That promo code has been fully redeemed" };
        }

        const items: OrderItem[] = input.items.map((it) => {
          const t = ev.tickets.find((x) => x.id === it.ticketId)!;
          return { ticketId: t.id, name: t.name, qty: it.qty, unit: t.price };
        });
        const addOnRows: OrderAddOn[] = input.addOns
          .map((a) => {
            const ao = ev.addOns.find((x) => x.id === a.addOnId)!;
            return { addOnId: ao.id, name: ao.name, qty: a.qty, unit: ao.price };
          })
          .filter((a) => a.qty > 0);
        const ticketCount = items.reduce((s, i) => s + i.qty, 0);
        const subtotal = items.reduce((s, i) => s + i.unit * i.qty, 0) + addOnRows.reduce((s, a) => s + a.unit * a.qty, 0);
        const totals = computeTotals(db.settings, subtotal, ticketCount, promo);
        const now = new Date().toISOString();
        const order: Order = {
          id: uid(), number: orderNumber(), eventId: ev.id, eventName: ev.name,
          buyer: input.buyer, items, addOns: addOnRows, promo: promo?.code, ...totals,
          status: totals.total > 0 ? "paid" : "free", method: totals.total > 0 ? "card" : "free", createdAt: now,
        };
        const created: Attendee[] = [];
        for (const it of items) {
          for (let i = 0; i < it.qty; i += 1) {
            created.push({
              id: uid(), orderId: order.id, orderNumber: order.number, eventId: ev.id, eventName: ev.name,
              ticketId: it.ticketId, ticketName: it.name,
              name: i === 0 ? input.buyer.name : `${input.buyer.name.split(" ")[0]} +${i}`,
              email: input.buyer.email, code: ticketCode(), answers: { ...input.answers }, createdAt: now,
            });
          }
        }
        setDb((d) => ({
          ...d,
          orders: [order, ...d.orders],
          attendees: [...created, ...d.attendees],
          events: d.events.map((e) =>
            e.id === ev.id
              ? {
                  ...e,
                  tickets: e.tickets.map((t) => {
                    const it = items.find((x) => x.ticketId === t.id);
                    return it ? { ...t, sold: t.sold + it.qty } : t;
                  }),
                  promos: promo ? e.promos.map((p) => (p.id === promo!.id ? { ...p, used: p.used + 1 } : p)) : e.promos,
                }
              : e,
          ),
        }));
        return { ok: true, order, attendees: created };
      },

      refundOrder: (orderId) =>
        setDb((d) => {
          const order = d.orders.find((o) => o.id === orderId);
          if (!order) return d;
          return {
            ...d,
            orders: d.orders.map((o) => (o.id === orderId ? { ...o, status: "refunded" as const } : o)),
            attendees: d.attendees.map((a) => (a.orderId === orderId ? { ...a, refunded: true, checkedInAt: undefined } : a)),
            events: d.events.map((e) =>
              e.id === order.eventId
                ? {
                    ...e,
                    tickets: e.tickets.map((t) => {
                      const it = order.items.find((x) => x.ticketId === t.id);
                      return it ? { ...t, sold: Math.max(0, t.sold - it.qty) } : t;
                    }),
                  }
                : e,
            ),
          };
        }),

      checkIn: (eventId, code, by) => {
        const attendee = db.attendees.find((a) => a.code.toLowerCase() === code.trim().toLowerCase());
        const ev = db.events.find((e) => e.id === eventId);
        let result: ScanResult = "invalid";
        if (attendee && attendee.eventId === eventId) {
          if (attendee.refunded) result = "refunded";
          else if (attendee.checkedInAt) result = "duplicate";
          else result = "ok";
        }
        const entry: ScanEntry = {
          id: uid(), code: code.trim().toUpperCase(), eventId, eventName: ev?.name ?? "",
          result, attendee: attendee?.name, by, at: new Date().toISOString(),
        };
        setDb((d) => ({
          ...d,
          scans: [entry, ...d.scans],
          attendees: result === "ok" ? d.attendees.map((a) => (a.id === attendee!.id ? { ...a, checkedInAt: entry.at } : a)) : d.attendees,
        }));
        return entry;
      },

      undoCheckIn: (attendeeId, by) =>
        setDb((d) => {
          const a = d.attendees.find((x) => x.id === attendeeId);
          if (!a) return d;
          const entry: ScanEntry = { id: uid(), code: a.code, eventId: a.eventId, eventName: a.eventName, result: "reversed", attendee: a.name, by, at: new Date().toISOString() };
          return {
            ...d,
            attendees: d.attendees.map((x) => (x.id === attendeeId ? { ...x, checkedInAt: undefined } : x)),
            scans: [entry, ...d.scans],
          };
        }),

      sendMessage: (m) =>
        setDb((d) => ({
          ...d,
          messages: [
            { id: uid(), eventId: m.eventId, eventName: d.events.find((e) => e.id === m.eventId)?.name ?? "", audience: m.audience, subject: m.subject, body: m.body, recipients: m.recipients, at: new Date().toISOString(), by: user.name },
            ...d.messages,
          ],
        })),

      addApiKey: (label) => {
        const key: ApiKey = { id: uid(), label, key: apiKey(), createdAt: new Date().toISOString() };
        setDb((d) => ({ ...d, apiKeys: [key, ...d.apiKeys] }));
        return key;
      },
      revokeApiKey: (id) => setDb((d) => ({ ...d, apiKeys: d.apiKeys.filter((k) => k.id !== id) })),
      resetDemo: () => {
        localStorage.removeItem(LS_KEY);
        window.location.hash = "#/";
        window.location.reload();
      },
    };

    const totals = (ev: EventItem, items: Array<{ ticketId: string; qty: number }>, addOns: Array<{ addOnId: string; qty: number }>, promo?: PromoCode): Totals => {
      const ticketCount = items.reduce((s, i) => s + i.qty, 0);
      const subtotal =
        items.reduce((s, i) => s + i.qty * (ev.tickets.find((t) => t.id === i.ticketId)?.price ?? 0), 0) +
        addOns.reduce((s, a) => s + a.qty * (ev.addOns.find((x) => x.id === a.addOnId)?.price ?? 0), 0);
      return computeTotals(db.settings, subtotal, ticketCount, promo);
    };

    return { db, user, can, api, totals };
  }, [db]);

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export function useApp(): Ctx {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}

/* ------------------------------------------------------------------ */
/* Selectors                                                           */
/* ------------------------------------------------------------------ */

export function eventSold(ev: EventItem): number {
  return ev.tickets.reduce((s, t) => s + t.sold, 0);
}

export function eventCapacity(ev: EventItem): number {
  return ev.tickets.reduce((s, t) => s + t.capacity, 0);
}

export function eventRevenue(orders: Order[], eventId: string): number {
  return orders.filter((o) => o.eventId === eventId && o.status !== "refunded").reduce((s, o) => s + o.total, 0);
}

export function eventCheckedIn(attendees: Attendee[], eventId: string): number {
  return attendees.filter((a) => a.eventId === eventId && a.checkedInAt && !a.refunded).length;
}

export { computeTotals };
