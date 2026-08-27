import { useState } from "react";
import type { AddOn, EventItem, EventType, PromoCode, Question, TicketType } from "../lib/types";
import { COVERS, TYPE_ACCENT, TYPE_LABEL, eventCapacity, eventRevenue, eventSold, useApp } from "../lib/store";
import { cx, fmtDateShort, inputDateValue, money, num, uid } from "../lib/utils";
import { Badge, Button, Card, EmptyState, Field, Input, Modal, ProgressBar, Select, StatusPill, Textarea, Toggle, useToast } from "../components/ui";
import { ICalendar, IEdit, IEye, IPin, IPlus, IQr, ITag, ITicket, ITrash, IUsers, IX } from "../components/icons";

const TYPES: EventType[] = ["conference", "concert", "workshop", "festival"];

/* ================= create modal ================= */

export function CreateEventModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (id: string) => void }) {
  const { api } = useApp();
  const [name, setName] = useState("");
  const [type, setType] = useState<EventType>("conference");
  const [date, setDate] = useState(() => inputDateValue(new Date(Date.now() + 30 * 86400000).toISOString()));

  return (
    <Modal open={open} onClose={onClose} title="New event" wide>
      <div className="space-y-4">
        <Field label="Event name">
          <Input autoFocus placeholder="e.g. Fieldnotes Festival 2026" value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <div>
          <p className="mb-1.5 text-[12px] font-semibold tracking-wide text-ink2">Format</p>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {TYPES.map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={cx(
                  "focus-ring group overflow-hidden rounded-xl border text-left transition-all duration-150",
                  type === t ? "border-flame shadow-[0_0_0_3px_rgb(232_67_31/0.15)]" : "border-line2 hover:border-faint",
                )}
              >
                <div className="relative h-16 overflow-hidden">
                  <img src={COVERS[t]} alt="" className={cx("h-full w-full object-cover transition-all duration-300", type === t ? "scale-105" : "opacity-70 group-hover:opacity-100")} loading="lazy" />
                  <span className="absolute inset-0" style={{ background: `linear-gradient(to top, ${TYPE_ACCENT[t]}cc, transparent 70%)` }} />
                </div>
                <div className="flex items-center justify-between bg-white px-2.5 py-1.5">
                  <span className="text-[12.5px] font-semibold">{TYPE_LABEL[t]}</span>
                  {type === t && <span className="h-2 w-2 rounded-full bg-flame" />}
                </div>
              </button>
            ))}
          </div>
        </div>
        <Field label="Starts on">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            disabled={!name.trim()}
            onClick={() => {
              const id = api.createEvent({ name: name.trim(), type, start: new Date(`${date}T18:00`).toISOString() });
              setName("");
              onCreated(id);
            }}
          >
            <IPlus size={15} /> Create event
          </Button>
        </div>
      </div>
    </Modal>
  );
}

/* ================= list ================= */

export function EventsList({ navigate }: { navigate: (to: string) => void }) {
  const { db, can } = useApp();
  const toast = useToast();
  const [creating, setCreating] = useState(false);
  const cur = db.settings.currency;
  const events = [...db.events].sort((a, b) => (a.start < b.start ? -1 : 1));

  return (
    <div className="mx-auto max-w-[1200px] space-y-5 px-5 pb-16 pt-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[28px] font-bold tracking-tight">Events</h1>
          <p className="text-[13.5px] text-mut">{db.events.length} events · {db.events.filter((e) => e.status === "live").length} live now</p>
        </div>
        <Button onClick={() => (can("edit") ? setCreating(true) : toast({ kind: "bad", title: "No permission", desc: "Scanners can't create events." }))}>
          <IPlus size={15} /> New event
        </Button>
      </div>

      {events.length === 0 && (
        <EmptyState icon={<ITicket size={22} />} title="No events yet" desc="Create your first event — a conference, concert, workshop or festival — and start selling in minutes." action={<Button onClick={() => setCreating(true)}><IPlus size={15} /> Create event</Button>} />
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {events.map((e) => {
          const sold = eventSold(e);
          const cap = eventCapacity(e);
          const rev = eventRevenue(db.orders, e.id);
          return (
            <Card key={e.id} hover className="group overflow-hidden">
              <button className="focus-ring block w-full text-left" onClick={() => navigate(`/events/${e.id}`)}>
                <div className="relative h-36 overflow-hidden">
                  <img src={e.cover} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" loading="lazy" />
                  <div className="absolute inset-0" style={{ background: `linear-gradient(to top, #141917d9 0%, #14191733 55%, transparent)` }} />
                  <div className="absolute left-3.5 top-3.5 flex gap-1.5">
                    <Badge tone="night">{TYPE_LABEL[e.type]}</Badge>
                    <StatusPill status={e.status} />
                  </div>
                  <div className="absolute bottom-3 left-3.5 right-3.5">
                    <h3 className="font-display text-[19px] font-bold leading-tight tracking-tight text-white">{e.name}</h3>
                  </div>
                </div>
                <div className="space-y-3 p-4">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] text-mut">
                    <span className="inline-flex items-center gap-1.5"><ICalendar size={13} />{fmtDateShort(e.start)}</span>
                    <span className="inline-flex items-center gap-1.5"><IPin size={13} />{e.venue} · {e.city}</span>
                  </div>
                  {e.status !== "draft" ? (
                    <>
                      <div className="flex items-center gap-2.5">
                        <ProgressBar value={cap ? (sold / cap) * 100 : 0} color={e.accent} className="flex-1" />
                        <span className="code-pill shrink-0 text-[11px] text-mut">{num(sold)} / {num(cap)}</span>
                      </div>
                      <div className="flex items-center justify-between border-t border-dashed border-line pt-2.5">
                        <span className="text-[12px] font-medium text-mut">Gross revenue</span>
                        <span className="font-display text-[16px] font-bold tracking-tight">{money(rev, cur)}</span>
                      </div>
                    </>
                  ) : (
                    <p className="border-t border-dashed border-line pt-2.5 text-[12.5px] italic text-faint">Draft — configure tickets and publish when ready.</p>
                  )}
                </div>
              </button>
              <div className="flex items-center gap-1.5 border-t border-line bg-white/60 px-4 py-2.5">
                <Button size="sm" variant="outline" onClick={() => navigate(`/events/${e.id}`)}><IEdit size={13} /> Manage</Button>
                <Button size="sm" variant="ghost" onClick={() => navigate(`/page/${e.slug}`)}><IEye size={13} /> Page</Button>
                {e.status === "live" && <Button size="sm" variant="ghost" onClick={() => navigate(`/checkin?event=${e.id}`)}><IQr size={13} /> Check-in</Button>}
                <span className="ml-auto inline-flex items-center gap-1 text-[11.5px] text-faint"><IUsers size={12} />{e.tickets.length} tiers</span>
              </div>
            </Card>
          );
        })}
      </div>

      <CreateEventModal open={creating} onClose={() => setCreating(false)} onCreated={(id) => { setCreating(false); navigate(`/events/${id}`); }} />
    </div>
  );
}

/* ================= editor ================= */

const TABS = [
  { id: "details", label: "Details" },
  { id: "tickets", label: "Tickets" },
  { id: "addons", label: "Add-ons" },
  { id: "promos", label: "Promo codes" },
  { id: "questions", label: "Questions" },
  { id: "checkout", label: "Checkout" },
] as const;

export function EventEditor({ id, tab, navigate }: { id: string; tab: string; navigate: (to: string) => void }) {
  const { db, api, can } = useApp();
  const toast = useToast();
  const ev = db.events.find((e) => e.id === id);
  const editable = can("edit");
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!ev) {
    return (
      <div className="mx-auto max-w-[700px] px-5 pt-16">
        <EmptyState icon={<ITicket size={22} />} title="Event not found" desc="It may have been deleted. Head back to your events." action={<Button onClick={() => navigate("/events")}>Back to events</Button>} />
      </div>
    );
  }

  const curTab = TABS.some((t) => t.id === tab) ? tab : "details";
  const sold = eventSold(ev);
  const cap = eventCapacity(ev);

  return (
    <div className="mx-auto max-w-[1200px] space-y-5 px-5 pb-16 pt-6 lg:px-8">
      {/* header */}
      <div className="overflow-hidden rounded-xl border border-line bg-night text-[#f0f2ee] shadow-[var(--shadow-lift)]">
        <div className="relative h-40">
          <img src={ev.cover} alt="" className="h-full w-full object-cover opacity-80" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to top, #141917 8%, #14191744 60%, transparent)" }} />
          <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-3 p-5">
            <div>
              <button onClick={() => navigate("/events")} className="code-pill mb-2 text-[11px] uppercase tracking-widest text-[#9aa29a] transition-colors hover:text-white">← All events</button>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="font-display text-[26px] font-bold leading-none tracking-tight">{ev.name}</h1>
                <StatusPill status={ev.status} />
                <Badge tone="night" className="border-nightline">{TYPE_LABEL[ev.type]}</Badge>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="border-nightline bg-night2 text-[#e7eae4] hover:bg-night3" onClick={() => navigate(`/page/${ev.slug}`)}><IEye size={13} /> View page</Button>
              {editable && ev.status === "draft" && (
                <Button size="sm" onClick={() => { api.updateEvent(ev.id, { status: "live" }); toast({ kind: "ok", title: "Event is live", desc: "Your ticket page is now public." }); }}>Publish</Button>
              )}
              {editable && ev.status === "live" && (
                <Button size="sm" variant="outline" className="border-nightline bg-night2 text-[#e7eae4] hover:bg-night3" onClick={() => { api.updateEvent(ev.id, { status: "ended" }); toast({ kind: "info", title: "Event ended", desc: "Sales are closed." }); }}>End event</Button>
              )}
              {editable && ev.status === "ended" && (
                <Button size="sm" variant="teal" onClick={() => api.updateEvent(ev.id, { status: "live" })}>Reopen sales</Button>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-6 border-t border-nightline px-5 py-2.5 text-[12px] text-[#9aa29a]">
          <span className="inline-flex items-center gap-1.5"><ICalendar size={13} />{fmtDateShort(ev.start)}</span>
          <span className="inline-flex items-center gap-1.5"><IPin size={13} />{ev.venue} · {ev.city}</span>
          <span className="ml-auto code-pill">{num(sold)} sold / {num(cap)} cap</span>
          <span className="code-pill font-semibold text-[#e7eae4]">{money(eventRevenue(db.orders, ev.id), db.settings.currency)}</span>
        </div>
      </div>

      {!editable && (
        <div className="flex items-center gap-2.5 rounded-lg border border-warn/30 bg-warndim px-4 py-2.5 text-[13px] font-medium text-warn">
          You're viewing as a scanner — changes are read-only. Ask an admin for edit access.
        </div>
      )}

      {/* tabs */}
      <div className="flex flex-wrap gap-1 border-b border-line">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => navigate(`/events/${ev.id}/${t.id}`)}
            className={cx(
              "focus-ring -mb-px rounded-t-lg border-b-2 px-3.5 py-2 text-[13px] font-semibold transition-all",
              curTab === t.id ? "border-flame text-ink" : "border-transparent text-mut hover:text-ink",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className={cx(!editable && "pointer-events-none opacity-70")}>
        {curTab === "details" && <DetailsTab ev={ev} onDelete={() => setConfirmDelete(true)} />}
        {curTab === "tickets" && <TicketsTab ev={ev} />}
        {curTab === "addons" && <AddOnsTab ev={ev} />}
        {curTab === "promos" && <PromosTab ev={ev} />}
        {curTab === "questions" && <QuestionsTab ev={ev} />}
        {curTab === "checkout" && <CheckoutTab ev={ev} navigate={navigate} />}
      </div>

      <Modal open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Delete this event?">
        <p className="text-[13.5px] leading-relaxed text-ink2">
          <strong>{ev.name}</strong> and all of its orders, attendees and scan logs will be permanently removed. This can't be undone.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirmDelete(false)}>Keep it</Button>
          <Button variant="danger" onClick={() => { api.deleteEvent(ev.id); toast({ kind: "info", title: "Event deleted" }); navigate("/events"); }}><ITrash size={14} /> Delete event</Button>
        </div>
      </Modal>
    </div>
  );
}

/* ================= tabs ================= */

function DetailsTab({ ev, onDelete }: { ev: EventItem; onDelete: () => void }) {
  const { api, can } = useApp();
  const toast = useToast();
  const [form, setForm] = useState({
    name: ev.name, venue: ev.venue, city: ev.city, description: ev.description, type: ev.type,
    date: inputDateValue(ev.start), time: new Date(ev.start).toTimeString().slice(0, 5),
    accent: ev.accent, cover: ev.cover,
  });

  return (
    <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
      <Card className="space-y-4 p-5">
        <Field label="Event name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Format">
            <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as EventType })}>
              {TYPES.map((t) => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}
            </Select>
          </Field>
          <Field label="Venue"><Input value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} /></Field>
          <Field label="Date"><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field>
          <Field label="Start time"><Input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} /></Field>
          <Field label="City"><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="sm:col-span-2" /></Field>
        </div>
        <Field label="Description" hint="shown on the public page">
          <Textarea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </Field>
        <div className="flex justify-end">
          <Button
            onClick={() => {
              const start = new Date(`${form.date}T${form.time || "18:00"}`).toISOString();
              const end = new Date(new Date(start).getTime() + 4 * 3600000).toISOString();
              api.updateEvent(ev.id, { name: form.name, venue: form.venue, city: form.city, description: form.description, type: form.type, start, end, accent: form.accent, cover: form.cover });
              toast({ kind: "ok", title: "Details saved" });
            }}
          >
            Save details
          </Button>
        </div>
      </Card>

      <div className="space-y-5">
        <Card className="p-5">
          <p className="mb-2.5 text-[12px] font-semibold tracking-wide text-ink2">Brand color</p>
          <div className="flex items-center gap-2">
            {["#e8431f", "#0e6b60", "#a86a14", "#b03a64", "#5b5bd6", "#161a18"].map((c) => (
              <button key={c} onClick={() => setForm({ ...form, accent: c })} className={cx("focus-ring h-8 w-8 rounded-lg border-2 transition-transform hover:scale-110", form.accent === c ? "border-ink" : "border-transparent")} style={{ background: c }} aria-label={`accent ${c}`} />
            ))}
            <input type="color" value={form.accent} onChange={(e) => setForm({ ...form, accent: e.target.value })} className="h-8 w-8 cursor-pointer rounded-lg border border-line2 bg-white p-0.5" aria-label="Custom accent" />
          </div>
          <p className="mb-2.5 mt-5 text-[12px] font-semibold tracking-wide text-ink2">Cover image</p>
          <div className="grid grid-cols-2 gap-2">
            {TYPES.map((t) => (
              <button key={t} onClick={() => setForm({ ...form, cover: COVERS[t] })} className={cx("focus-ring relative h-14 overflow-hidden rounded-lg border-2 transition-all", form.cover === COVERS[t] ? "border-flame" : "border-transparent opacity-75 hover:opacity-100")}>
                <img src={COVERS[t]} alt={TYPE_LABEL[t]} className="h-full w-full object-cover" loading="lazy" />
              </button>
            ))}
          </div>
        </Card>

        {can("edit") && (
          <Card className="border-bad/25 p-5">
            <p className="text-[13px] font-bold text-bad">Danger zone</p>
            <p className="mt-1 text-[12.5px] leading-relaxed text-mut">Deleting removes orders, attendees and scan history for this event.</p>
            <Button variant="danger" size="sm" className="mt-3" onClick={onDelete}><ITrash size={13} /> Delete event</Button>
          </Card>
        )}
      </div>
    </div>
  );
}

function TicketsTab({ ev }: { ev: EventItem }) {
  const { api } = useApp();
  const toast = useToast();
  const [editing, setEditing] = useState<TicketType | null>(null);
  const [open, setOpen] = useState(false);

  const blank = (): TicketType => ({ id: uid(), name: "", description: "", price: 39, capacity: 100, sold: 0, active: true });

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
        <div>
          <h2 className="font-display text-[16px] font-bold tracking-tight">Ticket tiers</h2>
          <p className="text-[12px] text-mut">Set price to 0 for free tickets — fees still apply unless waived.</p>
        </div>
        <Button size="sm" onClick={() => { setEditing(blank()); setOpen(true); }}><IPlus size={14} /> Add tier</Button>
      </div>
      {ev.tickets.length === 0 ? (
        <div className="p-5"><EmptyState icon={<ITicket size={20} />} title="No ticket tiers" desc="Add at least one tier to start selling." action={<Button size="sm" onClick={() => { setEditing(blank()); setOpen(true); }}><IPlus size={14} /> Add tier</Button>} /></div>
      ) : (
        <div className="divide-y divide-line">
          {ev.tickets.map((t) => (
            <div key={t.id} className="flex flex-wrap items-center gap-4 px-5 py-3.5 transition-colors hover:bg-white/70">
              <div className="min-w-[180px] flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-[14px] font-semibold">{t.name}</p>
                  {t.price === 0 && <Badge tone="teal">Free</Badge>}
                  {!t.active && <Badge>Hidden</Badge>}
                </div>
                <p className="text-[12px] text-mut">{t.description || "—"}</p>
              </div>
              <div className="w-36">
                <div className="mb-1 flex justify-between text-[11px] text-mut">
                  <span className="code-pill">{num(t.sold)} sold</span>
                  <span className="code-pill">{num(t.capacity)} cap</span>
                </div>
                <ProgressBar value={t.capacity ? (t.sold / t.capacity) * 100 : 0} color={ev.accent} />
              </div>
              <span className="font-display w-20 text-right text-[17px] font-bold tracking-tight">{t.price === 0 ? "Free" : money(t.price)}</span>
              <div className="flex items-center gap-2">
                <Toggle checked={t.active} onChange={(v) => { api.saveTicket(ev.id, { ...t, active: v }); toast({ kind: "info", title: v ? "Tier visible" : "Tier hidden" }); }} />
                <Button size="sm" variant="ghost" onClick={() => { setEditing(t); setOpen(true); }}><IEdit size={14} /></Button>
                <Button size="sm" variant="ghost" className="text-bad hover:bg-baddim" onClick={() => { api.removeTicket(ev.id, t.id); toast({ kind: "info", title: "Tier removed" }); }}><ITrash size={14} /></Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing && ev.tickets.some((t) => t.id === editing.id) ? "Edit tier" : "New tier"}>
        {editing && (
          <div className="space-y-4">
            <Field label="Name"><Input autoFocus value={editing.name} placeholder="e.g. Early Bird" onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></Field>
            <Field label="Description"><Input value={editing.description} placeholder="What's included?" onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Price" hint="0 = free"><Input type="number" min={0} step="0.01" value={editing.price} onChange={(e) => setEditing({ ...editing, price: Math.max(0, Number(e.target.value)) })} /></Field>
              <Field label="Capacity"><Input type="number" min={editing.sold} value={editing.capacity} onChange={(e) => setEditing({ ...editing, capacity: Math.max(editing.sold, Number(e.target.value)) })} /></Field>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button
                disabled={!editing.name.trim()}
                onClick={() => { api.saveTicket(ev.id, { ...editing, name: editing.name.trim() }); setOpen(false); toast({ kind: "ok", title: "Tier saved" }); }}
              >
                Save tier
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </Card>
  );
}

function AddOnsTab({ ev }: { ev: EventItem }) {
  const { api } = useApp();
  const toast = useToast();
  const [editing, setEditing] = useState<AddOn | null>(null);
  const [open, setOpen] = useState(false);
  const blank = (): AddOn => ({ id: uid(), name: "", description: "", price: 10, active: true });

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
        <div>
          <h2 className="font-display text-[16px] font-bold tracking-tight">Add-ons</h2>
          <p className="text-[12px] text-mut">Parking, merch, workshops — sold alongside tickets at checkout.</p>
        </div>
        <Button size="sm" onClick={() => { setEditing(blank()); setOpen(true); }}><IPlus size={14} /> Add-on</Button>
      </div>
      {ev.addOns.length === 0 ? (
        <div className="p-5"><EmptyState icon={<IPlus size={20} />} title="No add-ons" desc="Boost order value with extras like parking or merch bundles." /></div>
      ) : (
        <div className="divide-y divide-line">
          {ev.addOns.map((a) => (
            <div key={a.id} className="flex items-center gap-4 px-5 py-3 transition-colors hover:bg-white/70">
              <div className="flex-1">
                <p className="text-[14px] font-semibold">{a.name} {!a.active && <Badge className="ml-1">Hidden</Badge>}</p>
                <p className="text-[12px] text-mut">{a.description || "—"}</p>
              </div>
              <span className="font-display text-[15px] font-bold">{money(a.price)}</span>
              <Toggle checked={a.active} onChange={(v) => { api.saveAddOn(ev.id, { ...a, active: v }); }} />
              <Button size="sm" variant="ghost" onClick={() => { setEditing(a); setOpen(true); }}><IEdit size={14} /></Button>
              <Button size="sm" variant="ghost" className="text-bad hover:bg-baddim" onClick={() => { api.removeAddOn(ev.id, a.id); toast({ kind: "info", title: "Add-on removed" }); }}><ITrash size={14} /></Button>
            </div>
          ))}
        </div>
      )}
      <Modal open={open} onClose={() => setOpen(false)} title={editing && ev.addOns.some((a) => a.id === editing.id) ? "Edit add-on" : "New add-on"}>
        {editing && (
          <div className="space-y-4">
            <Field label="Name"><Input autoFocus value={editing.name} placeholder="e.g. Parking" onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></Field>
            <Field label="Description"><Input value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></Field>
            <Field label="Price"><Input type="number" min={0} step="0.01" value={editing.price} onChange={(e) => setEditing({ ...editing, price: Math.max(0, Number(e.target.value)) })} /></Field>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button disabled={!editing.name.trim()} onClick={() => { api.saveAddOn(ev.id, { ...editing, name: editing.name.trim() }); setOpen(false); toast({ kind: "ok", title: "Add-on saved" }); }}>Save</Button>
            </div>
          </div>
        )}
      </Modal>
    </Card>
  );
}

function PromosTab({ ev }: { ev: EventItem }) {
  const { api } = useApp();
  const toast = useToast();
  const [editing, setEditing] = useState<PromoCode | null>(null);
  const [open, setOpen] = useState(false);
  const blank = (): PromoCode => ({ id: uid(), code: "", kind: "percent", value: 10, limit: 100, used: 0, active: true });

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
        <div>
          <h2 className="font-display text-[16px] font-bold tracking-tight">Promo codes</h2>
          <p className="text-[12px] text-mut">Percentage or fixed-amount discounts, with redemption caps.</p>
        </div>
        <Button size="sm" onClick={() => { setEditing(blank()); setOpen(true); }}><IPlus size={14} /> New code</Button>
      </div>
      {ev.promos.length === 0 ? (
        <div className="p-5"><EmptyState icon={<ITag size={20} />} title="No promo codes" desc="Run an early-bird special or reward your newsletter with a code." action={<Button size="sm" onClick={() => { setEditing(blank()); setOpen(true); }}><IPlus size={14} /> New code</Button>} /></div>
      ) : (
        <div className="divide-y divide-line">
          {ev.promos.map((p) => (
            <div key={p.id} className="flex flex-wrap items-center gap-4 px-5 py-3 transition-colors hover:bg-white/70">
              <span className="code-pill rounded-md border border-dashed border-flame/50 bg-flamedim px-2.5 py-1 text-[12.5px] font-bold tracking-widest text-flame">{p.code}</span>
              <span className="text-[13px] font-semibold text-ink2">{p.kind === "percent" ? `${p.value}% off` : `${money(p.value)} off`}</span>
              <div className="w-32">
                <div className="mb-1 flex justify-between text-[11px] text-mut"><span>used</span><span className="code-pill">{p.used}/{p.limit}</span></div>
                <ProgressBar value={(p.used / p.limit) * 100} color="var(--color-flame)" />
              </div>
              <StatusPill status={p.active ? "active" : "draft"} />
              <div className="ml-auto flex items-center gap-2">
                <Toggle checked={p.active} onChange={(v) => api.savePromo(ev.id, { ...p, active: v })} />
                <Button size="sm" variant="ghost" onClick={() => { setEditing(p); setOpen(true); }}><IEdit size={14} /></Button>
                <Button size="sm" variant="ghost" className="text-bad hover:bg-baddim" onClick={() => { api.removePromo(ev.id, p.id); toast({ kind: "info", title: "Code removed" }); }}><ITrash size={14} /></Button>
              </div>
            </div>
          ))}
        </div>
      )}
      <Modal open={open} onClose={() => setOpen(false)} title={editing && ev.promos.some((p) => p.id === editing.id) ? "Edit code" : "New promo code"}>
        {editing && (
          <div className="space-y-4">
            <Field label="Code"><Input autoFocus value={editing.code} placeholder="EARLYBIRD" className="code-pill uppercase" onChange={(e) => setEditing({ ...editing, code: e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, "") })} /></Field>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Type">
                <Select value={editing.kind} onChange={(e) => setEditing({ ...editing, kind: e.target.value as "percent" | "fixed" })}>
                  <option value="percent">Percent</option>
                  <option value="fixed">Fixed</option>
                </Select>
              </Field>
              <Field label={editing.kind === "percent" ? "% off" : "Amount off"}>
                <Input type="number" min={1} value={editing.value} onChange={(e) => setEditing({ ...editing, value: Math.max(0, Number(e.target.value)) })} />
              </Field>
              <Field label="Redemption cap"><Input type="number" min={1} value={editing.limit} onChange={(e) => setEditing({ ...editing, limit: Math.max(1, Number(e.target.value)) })} /></Field>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button disabled={!editing.code.trim()} onClick={() => { api.savePromo(ev.id, { ...editing, code: editing.code.trim() }); setOpen(false); toast({ kind: "ok", title: "Code saved", desc: `“${editing.code}” is ${editing.active ? "live" : "paused"}.` }); }}>Save code</Button>
            </div>
          </div>
        )}
      </Modal>
    </Card>
  );
}

function QuestionsTab({ ev }: { ev: EventItem }) {
  const { api } = useApp();
  const toast = useToast();
  const [qs, setQs] = useState<Question[]>(ev.questions);

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="font-display text-[16px] font-bold tracking-tight">Checkout questions</h2>
          <p className="text-[12px] text-mut">Asked per order at checkout. Answers land in the attendee table and CSV exports.</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setQs(ev.questions)}><IX size={13} /> Reset</Button>
          <Button size="sm" onClick={() => { api.saveQuestions(ev.id, qs.filter((q) => q.label.trim())); toast({ kind: "ok", title: "Questions saved" }); }}>Save questions</Button>
        </div>
      </div>
      <div className="space-y-2.5">
        {qs.map((q, i) => (
          <div key={q.id} className="flex flex-wrap items-center gap-2.5 rounded-lg border border-line bg-white p-2.5">
            <span className="code-pill w-6 text-center text-[11px] text-faint">{i + 1}</span>
            <Input className="h-9 min-w-[200px] flex-1" value={q.label} placeholder="e.g. Dietary preference" onChange={(e) => setQs(qs.map((x) => (x.id === q.id ? { ...x, label: e.target.value } : x)))} />
            <Select className="h-9 w-36" value={q.type} onChange={(e) => setQs(qs.map((x) => (x.id === q.id ? { ...x, type: e.target.value as Question["type"], options: x.options ?? ["Option A", "Option B"] } : x)))}>
              <option value="text">Short text</option>
              <option value="select">Dropdown</option>
              <option value="checkbox">Yes / no</option>
            </Select>
            {q.type === "select" && (
              <Input className="h-9 w-56" value={(q.options ?? []).join(", ")} placeholder="Options, comma separated" onChange={(e) => setQs(qs.map((x) => (x.id === q.id ? { ...x, options: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) } : x)))} />
            )}
            <label className="flex items-center gap-1.5 text-[12px] font-medium text-ink2">
              <input type="checkbox" checked={q.required} onChange={(e) => setQs(qs.map((x) => (x.id === q.id ? { ...x, required: e.target.checked } : x)))} className="h-4 w-4 accent-[#e8431f]" />
              Required
            </label>
            <button className="focus-ring rounded-md p-1.5 text-mut transition-colors hover:bg-baddim hover:text-bad" onClick={() => setQs(qs.filter((x) => x.id !== q.id))}><ITrash size={15} /></button>
          </div>
        ))}
        {qs.length === 0 && <p className="rounded-lg border border-dashed border-line2 px-4 py-6 text-center text-[13px] text-faint">No questions yet — collect exactly what you need at the door.</p>}
      </div>
      <Button variant="outline" size="sm" className="mt-3" onClick={() => setQs([...qs, { id: uid(), label: "", type: "text", required: false }])}><IPlus size={14} /> Add question</Button>
    </Card>
  );
}

function CheckoutTab({ ev, navigate }: { ev: EventItem; navigate: (to: string) => void }) {
  const { api, db } = useApp();
  const toast = useToast();
  const [form, setForm] = useState(ev.checkout);
  const s = db.settings;

  return (
    <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
      <Card className="space-y-4 p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Checkout button label"><Input value={form.buttonLabel} onChange={(e) => setForm({ ...form, buttonLabel: e.target.value })} /></Field>
          <Field label="Support note" hint="shown under the total">
            <Input value={form.note} placeholder="e.g. Questions? hello@you.com" onChange={(e) => setForm({ ...form, note: e.target.value })} />
          </Field>
        </div>
        <div className="space-y-3 rounded-lg border border-line bg-white p-4">
          <Toggle checked={form.requireEmail} onChange={(v) => setForm({ ...form, requireEmail: v })} label="Require email per order (tickets are emailed)" />
          <Toggle checked={form.collectCompany} onChange={(v) => setForm({ ...form, collectCompany: v })} label="Collect company name" />
          <Toggle checked={form.allowPromos} onChange={(v) => setForm({ ...form, allowPromos: v })} label="Allow promo codes at checkout" />
        </div>
        <div className="flex justify-end">
          <Button onClick={() => { api.saveCheckout(ev.id, form); toast({ kind: "ok", title: "Checkout updated" }); }}>Save checkout</Button>
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="font-display text-[15px] font-bold tracking-tight">Fees & taxes applied</h3>
        <p className="mt-1 text-[12.5px] leading-relaxed text-mut">These come from your organization settings and apply to every event.</p>
        <div className="mt-4 space-y-2.5 text-[13px]">
          <div className="flex justify-between"><span className="text-mut">Service fee</span><span className="code-pill font-semibold">{s.feePercent}% + {money(s.feeFixed, s.currency)} / ticket</span></div>
          <div className="flex justify-between"><span className="text-mut">Tax on tickets + fees</span><span className="code-pill font-semibold">{s.taxRate}%</span></div>
          <div className="flex justify-between"><span className="text-mut">Currency</span><span className="code-pill font-semibold">{s.currency}</span></div>
        </div>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => navigate("/settings")}>Change in settings</Button>
        <div className="perf-x mt-5" />
        <p className="mt-4 text-[12.5px] leading-relaxed text-mut">
          Example — 2× {ev.tickets[0]?.name ?? "ticket"} at {money(ev.tickets[0]?.price ?? 0, s.currency)}:
        </p>
        {ev.tickets[0] && (() => {
          const sub = ev.tickets[0].price * 2;
          const fee = sub * (s.feePercent / 100) + s.feeFixed * 2;
          const tax = (sub + fee) * (s.taxRate / 100);
          return (
            <div className="code-pill mt-2 space-y-1 rounded-lg bg-night p-3.5 text-[12px] text-[#c8cec6]">
              <div className="flex justify-between"><span>Subtotal</span><span>{money(sub, s.currency)}</span></div>
              <div className="flex justify-between"><span>Fees</span><span>{money(fee, s.currency)}</span></div>
              <div className="flex justify-between"><span>Tax</span><span>{money(tax, s.currency)}</span></div>
              <div className="flex justify-between border-t border-nightline pt-1.5 font-bold text-white"><span>Total</span><span>{money(sub + fee + tax, s.currency)}</span></div>
            </div>
          );
        })()}
      </Card>
    </div>
  );
}
