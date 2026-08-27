import { useEffect, useMemo, useRef, useState } from "react";
import { Reveal } from "./ui";
import { ITicket, IScan, IChart, IUsers, IArrowR } from "./icons";

type EntriaExperienceProps = {
  onCreateEvent?: () => void;
  onExplore?: () => void;
};

function usePointerGlow() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const move = (event: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${event.clientX - rect.left}px`);
      el.style.setProperty("--my", `${event.clientY - rect.top}px`);
    };
    el.addEventListener("pointermove", move);
    return () => el.removeEventListener("pointermove", move);
  }, []);
  return ref;
}

function QrVisual() {
  const cells = useMemo(() => Array.from({ length: 144 }, (_, i) => {
    const x = i % 12;
    const y = Math.floor(i / 12);
    const finder = (ox: number, oy: number) => x >= ox && x < ox + 5 && y >= oy && y < oy + 5 &&
      (x === ox || x === ox + 4 || y === oy || y === oy + 4 || (x === ox + 2 && y === oy + 2));
    const noise = ((x * 17 + y * 31 + x * y * 7) % 11) < 5;
    return finder(0, 0) || finder(7, 0) || finder(0, 7) || noise;
  }), []);
  return <div className="grid grid-cols-12 gap-[2px] rounded-xl bg-white p-2 shadow-[0_20px_60px_rgba(0,0,0,.35)]">
    {cells.map((on, i) => <span key={i} className={`aspect-square rounded-[1px] ${on ? "bg-[#07100d]" : "bg-transparent"}`} />)}
  </div>;
}

export default function EntriaExperience({ onCreateEvent, onExplore }: EntriaExperienceProps) {
  const heroRef = usePointerGlow();
  const [flow, setFlow] = useState(0);
  const steps = [
    { title: "Invite", copy: "A private event page or WhatsApp invite opens the experience." },
    { title: "Purchase", copy: "Guest selects the exact headcount and completes payment online." },
    { title: "Pass", copy: "A unique access pass is issued for that exact number of people." },
    { title: "Gate", copy: "One scan consumes the pass. Reuse is rejected immediately." },
  ];

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#070907] text-white selection:bg-amber-200 selection:text-black">
      <section ref={heroRef} className="relative isolate min-h-[900px] overflow-hidden bg-[radial-gradient(circle_at_75%_22%,rgba(193,151,65,.18),transparent_28%),radial-gradient(circle_at_20%_70%,rgba(12,104,85,.22),transparent_34%),#070907]">
        <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.045)_1px,transparent_1px)] [background-size:72px_72px] [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />
        <div className="pointer-events-none absolute -left-40 top-20 h-[520px] w-[520px] rounded-full bg-emerald-500/10 blur-[110px]" />
        <div className="pointer-events-none absolute -right-40 top-10 h-[620px] w-[620px] rounded-full bg-amber-300/10 blur-[120px]" />

        <div className="relative mx-auto max-w-[1400px] px-5 pb-20 pt-7 lg:px-10">
          <nav className="flex items-center justify-between border-b border-white/10 pb-5">
            <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="flex items-center gap-3 text-left">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-amber-200/40 bg-amber-100/10 font-display text-lg font-black text-amber-100 shadow-[0_0_40px_rgba(226,184,91,.12)]">E</div>
              <div><div className="font-display text-lg font-black tracking-[.22em]">ENTRIA</div><div className="text-[8px] uppercase tracking-[.32em] text-white/35">Guest experience · access</div></div>
            </button>
            <div className="hidden items-center gap-7 text-[10px] font-bold uppercase tracking-[.2em] text-white/45 md:flex">
              <a href="#how">How it works</a><a href="#experience">Experience</a><a href="#security">Access control</a>
            </div>
            <button onClick={onCreateEvent} className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[10px] font-bold uppercase tracking-[.18em] backdrop-blur transition hover:bg-white/15">Create event</button>
          </nav>

          <div className="grid items-center gap-14 py-20 lg:min-h-[700px] lg:grid-cols-[1.05fr_.95fr] lg:py-24">
            <Reveal>
              <div className="max-w-3xl">
                <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-amber-200/20 bg-amber-100/5 px-3.5 py-2 text-[9px] font-bold uppercase tracking-[.24em] text-amber-100/80">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_16px_rgba(110,231,183,.9)]" />
                  Built for Nigeria's private & high-profile events
                </div>
                <h1 className="font-display text-[62px] font-black leading-[.86] tracking-[-.065em] sm:text-[86px] lg:text-[112px]">
                  THE INVITE
                  <br />
                  <span className="bg-gradient-to-r from-amber-100 via-yellow-200 to-amber-500 bg-clip-text text-transparent">IS THE ACCESS.</span>
                </h1>
                <p className="mt-8 max-w-2xl text-base leading-7 text-white/55 sm:text-lg sm:leading-8">
                  A discreet digital guest experience that makes every ticket count. Control who enters, how many enter, and what happens when the QR pass reaches the gate.
                </p>
                <div className="mt-9 flex flex-wrap gap-3">
                  <button onClick={onCreateEvent} className="group flex items-center gap-3 rounded-full bg-white px-5 py-3 text-[11px] font-black uppercase tracking-[.16em] text-black transition hover:-translate-y-0.5">Build an event <IArrowR size={15} className="transition group-hover:translate-x-1" /></button>
                  <button onClick={onExplore} className="rounded-full border border-white/15 bg-white/5 px-5 py-3 text-[11px] font-bold uppercase tracking-[.16em] text-white/80 backdrop-blur transition hover:bg-white/10">See the access flow</button>
                </div>
                <div className="mt-9 flex flex-wrap gap-x-6 gap-y-2 text-[9px] uppercase tracking-[.22em] text-white/30">
                  <span>Online payment</span><span>One-time QR</span><span>WhatsApp delivery</span><span>Offline gate mode</span>
                </div>
              </div>
            </Reveal>

            <Reveal delay={120}>
              <div className="relative mx-auto w-full max-w-[560px] [perspective:1400px]">
                <div className="absolute -inset-10 rounded-[40px] bg-amber-300/10 blur-[70px]" />
                <div className="relative rotate-[2deg] rounded-[32px] border border-white/15 bg-white/[.07] p-3 shadow-[0_50px_120px_rgba(0,0,0,.55)] backdrop-blur-xl transition duration-700 hover:rotate-0">
                  <div className="overflow-hidden rounded-[24px] border border-white/10 bg-[#0b110e]">
                    <div className="relative h-[500px] overflow-hidden bg-[radial-gradient(circle_at_55%_18%,rgba(221,183,92,.25),transparent_30%),linear-gradient(145deg,#15221c,#080b09_65%)]">
                      <div className="absolute -right-24 -top-28 h-72 w-72 rounded-full border border-amber-200/10 bg-amber-200/5 blur-sm" />
                      <div className="absolute left-8 top-8 text-[9px] uppercase tracking-[.3em] text-white/35">PRIVATE INVITATION</div>
                      <div className="absolute right-8 top-8 rounded-full border border-emerald-200/20 bg-emerald-300/10 px-2.5 py-1 text-[8px] font-bold uppercase tracking-[.18em] text-emerald-200">Confirmed</div>
                      <div className="absolute inset-x-8 bottom-8 rounded-[26px] border border-white/10 bg-black/35 p-6 backdrop-blur-xl">
                        <div className="text-[9px] uppercase tracking-[.28em] text-white/35">Lagos · Victoria Island</div>
                        <div className="mt-3 font-display text-5xl font-black leading-[.9]">MIDNIGHT<br /><span className="text-amber-200">LAGOS</span></div>
                        <div className="mt-5 flex items-end justify-between gap-4">
                          <div><div className="text-[9px] uppercase tracking-[.18em] text-white/30">Access pass</div><div className="mt-1 font-mono text-xs text-white/70">ENT-7X4K-••••</div></div>
                          <div className="w-24"><QrVisual /></div>
                        </div>
                        <div className="mt-5 flex justify-between border-t border-white/10 pt-4 text-[9px] uppercase tracking-[.18em] text-white/35"><span>Valid for 2 guests</span><span>One-time entry</span></div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute -bottom-5 -left-5 rounded-2xl border border-white/10 bg-[#111713]/90 px-4 py-3 shadow-2xl backdrop-blur-xl"><div className="text-[8px] uppercase tracking-[.2em] text-white/30">Gate status</div><div className="mt-1 flex items-center gap-2 text-xs font-bold"><span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(110,231,183,.8)]" /> 1,248 admitted</div></div>
                <div className="absolute -right-4 top-24 rounded-2xl border border-amber-200/15 bg-[#17140d]/90 px-4 py-3 shadow-2xl backdrop-blur-xl"><div className="text-[8px] uppercase tracking-[.2em] text-amber-100/40">Capacity</div><div className="mt-1 font-display text-lg font-black text-amber-100">1,500 / 1,500</div></div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section id="how" className="border-y border-white/10 bg-[#0a0e0c] py-24">
        <div className="mx-auto max-w-[1200px] px-5 lg:px-10">
          <div className="grid gap-12 lg:grid-cols-[.75fr_1.25fr]">
            <Reveal><div><div className="text-[9px] font-bold uppercase tracking-[.28em] text-amber-200/60">The problem it solves</div><h2 className="mt-4 font-display text-5xl font-black leading-[.9] tracking-[-.04em] sm:text-6xl">SELL 1,000.<br /><span className="text-white/35">LET 1,000 IN.</span></h2><p className="mt-6 max-w-md text-sm leading-7 text-white/45">No more guest saying “I’m coming alone” and arriving with three people. The ticket quantity becomes the access quantity.</p></div></Reveal>
            <Reveal delay={100}>
              <div className="grid gap-3 sm:grid-cols-2">
                {steps.map((step, i) => <button key={step.title} onClick={() => setFlow(i)} className={`group rounded-3xl border p-6 text-left transition duration-300 ${flow === i ? "border-amber-200/25 bg-amber-100/[.06] -translate-y-1" : "border-white/10 bg-white/[.025] hover:bg-white/[.05]"}`}>
                  <div className="flex items-center justify-between"><span className={`font-mono text-[10px] ${flow === i ? "text-amber-200" : "text-white/25"}`}>0{i + 1}</span><IArrowR size={14} className={`transition ${flow === i ? "text-amber-200 translate-x-1" : "text-white/20"}`} /></div>
                  <div className="mt-12 font-display text-2xl font-black">{step.title}</div><p className="mt-2 text-xs leading-5 text-white/40">{step.copy}</p>
                </button>)}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section id="experience" className="relative overflow-hidden bg-[#080b09] py-28">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(15,113,88,.14),transparent_35%)]" />
        <div className="relative mx-auto max-w-[1200px] px-5 lg:px-10">
          <Reveal><div className="max-w-2xl"><div className="text-[9px] font-bold uppercase tracking-[.28em] text-emerald-200/60">Designed around the actual event</div><h2 className="mt-4 font-display text-5xl font-black leading-[.9] tracking-[-.045em] sm:text-7xl">FROM WHATSAPP<br /><span className="text-emerald-200">TO THE DOOR.</span></h2><p className="mt-6 text-sm leading-7 text-white/45">The experience should feel like a premium invitation, not a generic ticketing marketplace.</p></div></Reveal>
          <div className="mt-16 grid gap-4 lg:grid-cols-3">
            <Reveal><div className="min-h-[410px] rounded-[32px] border border-white/10 bg-gradient-to-b from-white/[.07] to-white/[.015] p-7 shadow-2xl"><div className="flex items-center justify-between text-[9px] uppercase tracking-[.2em] text-white/30"><span>01 · Invitation</span><IUsers size={17} /></div><div className="mt-24 rounded-3xl border border-white/10 bg-[#101612] p-5"><div className="text-[9px] uppercase tracking-[.2em] text-white/30">WhatsApp</div><div className="mt-4 rounded-2xl bg-emerald-950/60 p-4 text-sm leading-6 text-emerald-50">You’re invited.<br />Your access is reserved for <b>2 guests.</b></div><div className="mt-2 text-right text-[8px] text-white/20">Delivered · 7:42 PM</div></div><p className="mt-8 text-xs leading-5 text-white/40">Private invite links, RSVP, guest count and event details without forcing guests into an app.</p></div></Reveal>
            <Reveal delay={100}><div className="min-h-[410px] rounded-[32px] border border-white/10 bg-gradient-to-b from-amber-100/[.08] to-white/[.015] p-7 shadow-2xl"><div className="flex items-center justify-between text-[9px] uppercase tracking-[.2em] text-white/30"><span>02 · Pass</span><ITicket size={17} /></div><div className="mx-auto mt-16 w-[190px]"><QrVisual /><div className="mt-3 rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-center font-mono text-[9px] text-white/40">VALID · 2 GUESTS</div></div><p className="mt-8 text-xs leading-5 text-white/40">Payment confirmation issues a unique pass. Quantity is explicit. The pass is cryptographically bound to the event and entry rules.</p></div></Reveal>
            <Reveal delay={180}><div id="security" className="min-h-[410px] rounded-[32px] border border-emerald-200/10 bg-gradient-to-b from-emerald-100/[.07] to-white/[.015] p-7 shadow-2xl"><div className="flex items-center justify-between text-[9px] uppercase tracking-[.2em] text-white/30"><span>03 · Gate</span><IScan size={17} /></div><div className="mt-16 rounded-3xl border border-emerald-200/15 bg-emerald-950/20 p-5"><div className="flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-300 text-black"><IScan size={22} /></div><div><div className="text-[9px] uppercase tracking-[.18em] text-emerald-200/50">Scan result</div><div className="mt-1 font-display text-2xl font-black text-emerald-100">ACCESS GRANTED</div></div></div><div className="mt-5 grid grid-cols-2 gap-2 text-[9px] uppercase tracking-[.16em] text-white/35"><span className="rounded-xl bg-white/5 p-3">Pass · ENT-7X4K</span><span className="rounded-xl bg-white/5 p-3">Count · 2 / 2</span></div></div><div className="mt-3 rounded-2xl border border-red-300/10 bg-red-300/[.03] p-3 text-[9px] uppercase tracking-[.15em] text-white/30">Second scan → INVALID · ALREADY USED</div><p className="mt-6 text-xs leading-5 text-white/40">Fast enough for a gate. Clear enough for a non-technical gatekeeper. Private enough for celebrity guests.</p></div></Reveal>
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 bg-[#0b0f0d] py-24">
        <div className="mx-auto grid max-w-[1200px] items-center gap-12 px-5 lg:grid-cols-[1fr_.8fr] lg:px-10">
          <Reveal><div><div className="text-[9px] font-bold uppercase tracking-[.28em] text-amber-200/60">For the organiser</div><h2 className="mt-4 font-display text-5xl font-black leading-[.9] tracking-[-.04em] sm:text-6xl">ONE SCREEN.<br /><span className="text-white/35">TOTAL CONTROL.</span></h2><p className="mt-6 max-w-xl text-sm leading-7 text-white/45">Create the event, set capacity, define Early Bird / Regular / VIP tiers, see who paid, monitor admissions and keep the event moving.</p><div className="mt-8 grid max-w-lg grid-cols-2 gap-3"><div className="rounded-2xl border border-white/10 bg-white/[.03] p-4"><div className="text-[8px] uppercase tracking-[.18em] text-white/25">Capacity</div><div className="mt-2 font-display text-2xl font-black">1,000</div></div><div className="rounded-2xl border border-white/10 bg-white/[.03] p-4"><div className="text-[8px] uppercase tracking-[.18em] text-white/25">Checked in</div><div className="mt-2 font-display text-2xl font-black text-emerald-200">742</div></div><div className="rounded-2xl border border-white/10 bg-white/[.03] p-4"><div className="text-[8px] uppercase tracking-[.18em] text-white/25">Revenue</div><div className="mt-2 font-display text-2xl font-black">₦48.6M</div></div><div className="rounded-2xl border border-white/10 bg-white/[.03] p-4"><div className="text-[8px] uppercase tracking-[.18em] text-white/25">Fraud blocks</div><div className="mt-2 font-display text-2xl font-black text-amber-100">19</div></div></div></div></Reveal>
          <Reveal delay={120}><div className="rounded-[32px] border border-white/10 bg-white/[.035] p-5 shadow-[0_40px_100px_rgba(0,0,0,.35)]"><div className="rounded-[24px] border border-white/10 bg-[#080b09] p-5"><div className="flex items-center justify-between"><span className="text-[9px] uppercase tracking-[.2em] text-white/30">Event control</span><span className="rounded-full bg-emerald-300/10 px-2.5 py-1 text-[8px] uppercase tracking-[.15em] text-emerald-200">Live</span></div><div className="mt-7 font-display text-3xl font-black">Midnight Lagos</div><div className="mt-5 h-3 overflow-hidden rounded-full bg-white/10"><div className="h-full w-[74%] rounded-full bg-gradient-to-r from-emerald-300 to-amber-200" /></div><div className="mt-2 flex justify-between text-[9px] uppercase tracking-[.16em] text-white/25"><span>742 checked in</span><span>258 remaining</span></div><div className="mt-7 space-y-2">{["Early Bird · 250 sold","Regular · 468 sold","VIP · 24 sold"].map((x, i) => <div key={x} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[.025] px-3 py-3 text-[10px] text-white/50"><span>{x}</span><span className={i === 2 ? "text-amber-200" : "text-white/25"}>{i === 2 ? "₦2.4M" : i === 1 ? "₦18.7M" : "₦7.5M"}</span></div>)}</div></div></div></Reveal>
        </div>
      </section>

      <section className="relative overflow-hidden border-t border-white/10 bg-[#060806] py-28">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(209,168,78,.16),transparent_30%)]" />
        <div className="relative mx-auto max-w-[1000px] px-5 text-center lg:px-10">
          <Reveal><div className="text-[9px] font-bold uppercase tracking-[.3em] text-white/30">For the moments where access matters</div><h2 className="mt-5 font-display text-6xl font-black leading-[.85] tracking-[-.055em] sm:text-8xl">MAKE EVERY<br /><span className="bg-gradient-to-r from-white via-amber-100 to-amber-400 bg-clip-text text-transparent">GUEST COUNT.</span></h2><p className="mx-auto mt-7 max-w-xl text-sm leading-7 text-white/40">Private parties. Celebrity appearances. Concerts. Corporate experiences. One controlled journey from invitation to entrance.</p><div className="mt-9 flex justify-center gap-3"><button onClick={onCreateEvent} className="rounded-full bg-white px-6 py-3 text-[10px] font-black uppercase tracking-[.18em] text-black transition hover:-translate-y-0.5">Create your event</button><button onClick={onExplore} className="rounded-full border border-white/15 bg-white/5 px-6 py-3 text-[10px] font-bold uppercase tracking-[.18em] text-white/70">Explore platform</button></div></Reveal>
          <div className="mt-16 flex flex-wrap justify-center gap-x-8 gap-y-3 text-[8px] uppercase tracking-[.24em] text-white/20"><span>Lagos</span><span>Abuja</span><span>Port Harcourt</span><span>Paystack</span><span>WhatsApp</span><span>PWA</span><span>Offline ready</span></div>
        </div>
      </section>
    </div>
  );
}
