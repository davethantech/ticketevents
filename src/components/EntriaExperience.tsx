import { useEffect, useRef } from "react";
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

export default function EntriaExperience({ onCreateEvent, onExplore }: EntriaExperienceProps) {
  const heroRef = usePointerGlow();
  const features = [
    { icon: ITicket, title: "Ticketing", copy: "Free, paid, VIP, tiers, promo codes and add-ons." },
    { icon: IUsers, title: "Guest intelligence", copy: "Know who bought, who arrived and who needs attention." },
    { icon: IScan, title: "Secure arrivals", copy: "Fast QR verification, duplicate protection and gate logs." },
    { icon: IChart, title: "Live command", copy: "Revenue, capacity, sales and arrivals in one visual control room." },
  ];

  return (
    <div className="entria-experience min-h-screen bg-[#080b0a] text-white">
      <section ref={heroRef} className="entria-hero relative isolate overflow-hidden">
        <div className="entria-grid" />
        <div className="entria-glow entria-glow-a" />
        <div className="entria-glow entria-glow-b" />
        <div className="entria-orb entria-orb-a" />
        <div className="entria-orb entria-orb-b" />
        <div className="relative mx-auto flex min-h-[720px] max-w-[1280px] flex-col justify-between px-5 pb-10 pt-7 lg:px-10">
          <header className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="entria-mark">E</div>
              <div>
                <div className="font-display text-lg font-black tracking-[0.2em]">ENTRIA</div>
                <div className="code-pill text-[9px] uppercase tracking-[0.28em] text-white/40">Events / Experience / Access</div>
              </div>
            </div>
            <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-white/60 backdrop-blur md:flex">
              Lagos · Abuja · Port Harcourt · Global
            </div>
          </header>

          <div className="grid items-center gap-12 py-16 lg:grid-cols-[1.1fr_0.9fr]">
            <Reveal>
              <div className="max-w-2xl">
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-100">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_14px_rgba(110,231,183,.8)]" />
                  Nigerian event technology
                </div>
                <h1 className="font-display text-[60px] font-black leading-[0.92] tracking-[-0.05em] text-white sm:text-[82px] lg:text-[102px]">
                  EVENTS,
                  <br />
                  <span className="entria-gradient-text">ELEVATED.</span>
                </h1>
                <p className="mt-7 max-w-xl text-base leading-7 text-white/65 sm:text-lg">
                  Build unforgettable events, move tickets, command guest arrivals and know exactly what is happening at the gate — from one cinematic event operating system.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <button onClick={onCreateEvent} className="entria-button entria-button-primary">Create an event <IArrowR size={15} /></button>
                  <button onClick={onExplore} className="entria-button entria-button-ghost">Explore experiences</button>
                </div>
                <div className="mt-8 flex flex-wrap gap-5 text-[11px] uppercase tracking-[0.16em] text-white/35">
                  <span>Paystack-ready</span>
                  <span>Offline gate mode</span>
                  <span>Self-hosted</span>
                  <span>PWA</span>
                </div>
              </div>
            </Reveal>

            <Reveal delay={120}>
              <div className="relative mx-auto w-full max-w-[500px]">
                <div className="entria-stage-card">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(207,170,92,.32),transparent_45%)]" />
                  <div className="absolute inset-x-8 top-8 h-32 rounded-full bg-emerald-400/10 blur-3xl" />
                  <div className="relative p-6 sm:p-8">
                    <div className="flex items-center justify-between">
                      <span className="code-pill text-[10px] uppercase tracking-[0.2em] text-white/45">LIVE EVENT</span>
                      <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-bold text-emerald-200">● ON SALE</span>
                    </div>
                    <div className="mt-14">
                      <p className="text-[11px] uppercase tracking-[0.25em] text-white/40">Lagos · Victoria Island</p>
                      <h2 className="mt-3 font-display text-4xl font-black leading-none">Midnight<br /><span className="text-amber-200">Lagos</span></h2>
                      <p className="mt-3 max-w-[260px] text-sm leading-6 text-white/50">Music, fashion, culture and an arrival experience built to feel like the city after dark.</p>
                    </div>
                    <div className="mt-10 grid grid-cols-3 gap-2">
                      <div className="entria-mini-stat"><span>Tickets</span><strong>8,421</strong></div>
                      <div className="entria-mini-stat"><span>Revenue</span><strong>₦82M</strong></div>
                      <div className="entria-mini-stat"><span>Arrived</span><strong>73%</strong></div>
                    </div>
                    <div className="mt-7 rounded-2xl border border-white/10 bg-black/20 p-3 backdrop-blur">
                      <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.18em] text-white/40"><span>Access pulse</span><span>Gate 01</span></div>
                      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full w-[74%] rounded-full bg-gradient-to-r from-emerald-300 via-amber-200 to-orange-300 shadow-[0_0_20px_rgba(252,211,77,.35)]" /></div>
                      <div className="mt-2 flex justify-between text-[11px] text-white/45"><span>6,223 entered</span><span>2,198 remaining</span></div>
                    </div>
                  </div>
                </div>
                <div className="entria-float-tag entria-float-tag-a"><ITicket size={14} /> Secure ticket</div>
                <div className="entria-float-tag entria-float-tag-b"><IScan size={14} /> Offline gate</div>
              </div>
            </Reveal>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {features.map(({ icon: Icon, title, copy }, index) => (
              <Reveal key={title} delay={index * 80}>
                <div className="entria-feature-card">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-amber-200"><Icon size={18} /></div>
                  <div className="font-display text-sm font-bold">{title}</div>
                  <p className="mt-1 text-[12px] leading-5 text-white/40">{copy}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
