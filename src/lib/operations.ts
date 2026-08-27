export type AccessMode = "guest" | "ticketing" | "signature";
export type RSVPStatus = "pending" | "invited" | "confirmed" | "declined" | "waitlist";

export interface OpsGuest {
  id: string;
  eventId: string;
  name: string;
  email: string;
  phone?: string;
  inviteCode: string;
  allowedGuests: number;
  confirmedGuests: number;
  rsvp: RSVPStatus;
  table?: string;
  notes?: string;
  qrIssued: boolean;
  checkedIn: number;
  createdAt: string;
}

export interface Expense {
  id: string;
  eventId: string;
  category: string;
  description: string;
  amount: number;
  paid: boolean;
  createdAt: string;
}

export interface EventOps {
  eventId: string;
  accessMode: AccessMode;
  capacity: number;
  guestLimit: number;
  expenses: Expense[];
  guests: OpsGuest[];
  tables: Array<{ id: string; name: string; capacity: number; assigned: number }>;
  updatedAt: string;
}

const KEY = "entria:event-ops:v1";
const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,9)}`;
const save = (all: Record<string, EventOps>) => localStorage.setItem(KEY, JSON.stringify(all));

export function loadAllOps(): Record<string, EventOps> {
  try { return JSON.parse(localStorage.getItem(KEY) || "{}") as Record<string, EventOps>; } catch { return {}; }
}

export function getOps(eventId: string, capacity = 0): EventOps {
  const all = loadAllOps();
  if (all[eventId]) return all[eventId];
  const ops: EventOps = {
    eventId,
    accessMode: "ticketing",
    capacity,
    guestLimit: capacity,
    expenses: [],
    guests: [],
    tables: [
      { id: "t1", name: "VIP", capacity: 12, assigned: 0 },
      { id: "t2", name: "Table 2", capacity: 10, assigned: 0 },
      { id: "t3", name: "Table 3", capacity: 10, assigned: 0 },
    ],
    updatedAt: new Date().toISOString(),
  };
  all[eventId] = ops;
  save(all);
  return ops;
}

export function updateOps(eventId: string, patch: Partial<EventOps>): EventOps {
  const all = loadAllOps();
  const current = getOps(eventId);
  const next = { ...current, ...patch, updatedAt: new Date().toISOString() };
  all[eventId] = next;
  save(all);
  return next;
}

export function addGuest(eventId: string, input: Omit<OpsGuest, "id" | "eventId" | "inviteCode" | "createdAt" | "qrIssued" | "checkedIn">): OpsGuest {
  const all = loadAllOps();
  const ops = getOps(eventId);
  const guest: OpsGuest = {
    ...input,
    id: uid(), eventId, inviteCode: `ENT-${Math.random().toString(36).slice(2,8).toUpperCase()}`,
    qrIssued: input.rsvp === "confirmed", checkedIn: 0, createdAt: new Date().toISOString(),
  };
  all[eventId] = { ...ops, guests: [guest, ...ops.guests], updatedAt: new Date().toISOString() };
  save(all);
  return guest;
}

export function updateGuest(eventId: string, guestId: string, patch: Partial<OpsGuest>): EventOps {
  const ops = getOps(eventId);
  return updateOps(eventId, { guests: ops.guests.map(g => g.id === guestId ? { ...g, ...patch, qrIssued: patch.rsvp === "confirmed" ? true : g.qrIssued } : g) });
}

export function checkInGuest(eventId: string, guestId: string, count = 1): { ok: boolean; reason?: string; ops: EventOps } {
  const ops = getOps(eventId);
  const guest = ops.guests.find(g => g.id === guestId);
  if (!guest) return { ok: false, reason: "Guest not found", ops };
  if (guest.rsvp === "declined") return { ok: false, reason: "RSVP declined", ops };
  if (!guest.qrIssued) return { ok: false, reason: "Access pass has not been issued", ops };
  const next = guest.checkedIn + count;
  if (next > guest.confirmedGuests || next > guest.allowedGuests) return { ok: false, reason: `Access limit is ${Math.min(guest.allowedGuests, guest.confirmedGuests)} guest(s)`, ops };
  const updated = updateGuest(eventId, guestId, { checkedIn: next });
  return { ok: true, ops: updated };
}

export function addExpense(eventId: string, input: Omit<Expense, "id" | "eventId" | "createdAt">): EventOps {
  const ops = getOps(eventId);
  return updateOps(eventId, { expenses: [{ ...input, id: uid(), eventId, createdAt: new Date().toISOString() }, ...ops.expenses] });
}

export function deleteExpense(eventId: string, expenseId: string): EventOps {
  const ops = getOps(eventId);
  return updateOps(eventId, { expenses: ops.expenses.filter(e => e.id !== expenseId) });
}

export function addTable(eventId: string, name: string, capacity: number): EventOps {
  const ops = getOps(eventId);
  return updateOps(eventId, { tables: [...ops.tables, { id: uid(), name, capacity, assigned: 0 }] });
}

export function seedFromAttendees(eventId: string, attendees: Array<{ name: string; email: string; code: string }>): EventOps {
  const ops = getOps(eventId);
  if (ops.guests.length || !attendees.length) return ops;
  const guests = attendees.map(a => ({
    id: uid(), eventId, name: a.name, email: a.email, inviteCode: a.code, allowedGuests: 1,
    confirmedGuests: 1, rsvp: "confirmed" as RSVPStatus, qrIssued: true, checkedIn: 0,
    createdAt: new Date().toISOString(),
  }));
  return updateOps(eventId, { guests });
}
