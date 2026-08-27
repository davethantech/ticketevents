import { useEffect, useState } from "react";
import "../components/EntriaPublic.css";

const events = [
  { slug: "maya-reine-neon-coast", name: "Lagos After Dark", type: "LIMITED TICKETS", date: "12 SEP 2026", time: "8:00 PM — 2:00 AM", venue: "Eko Convention Centre", city: "Lagos, Nigeria", price: "₦50,000", image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1800&q=88" },
  { slug: "northloop-dev-summit-26", name: "The Gold Room", type: "INVITATION + RSVP", date: "26 SEP 2026", time: "7:30 PM — LATE", venue: "Victoria Island", city: "Lagos, Nigeria", price: "₦75,000", image: "https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=1800&q=88" },
  { slug: "sourdough-bake-day", name: "Lagos Fashion Night", type: "TICKETS AVAILABLE", date: "10 OCT 2026", time: "6:00 PM — 11:00 PM", venue: "Landmark Centre", city: "Lagos, Nigeria", price: "₦35,000", image: "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1800&q=88" },
  { slug: "wavelength-festival", name: "Afrobeats & Culture Weekend", type: "EARLY ACCESS", date: "21 NOV 2026", time: "12:00 PM — LATE", venue: "Muri Okunola Park", city: "Lagos, Nigeria", price: "₦25,000", image: "https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?auto=format&fit=crop&w=1800&q=88" },
];

const go = (path: string) => { window.location.hash = path; window.scrollTo({ top: 0, behavior: "smooth" }); };

function Hero() {
  const [index, setIndex] = useState(0);
  const event = events[index];
  useEffect(() => { const timer = window.setInterval(() => setIndex((x) => (x + 1) % events.length), 6200); return () => window.clearInterval(timer); }, []);
  return (
    <section className="ep-hero">
      <div className="ep-hero-media" aria-hidden="true">{events.map((e, i) => <img key={e.name} src={e.image} className={i === index ? "active" : ""} alt="" />)}</div>
      <div className="ep-shade" /><div className="ep-grid" />
      <nav className="ep-nav">
        <button className="ep-brand" onClick={() => go("/")} aria-label="Entria home"><span className="ep-brand-mark">e</span><span><b className="ep-brand-name">ENTRIA</b><small className="ep-brand-sub">EVENT TECHNOLOGIES · LAGOS</small></span></button>
        <div className="ep-navlinks"><a href="#events">Events</a><a href="#guest-experience">Guest experience</a><a href="#security">Access</a><a href="#faq">FAQ</a></div>
        <button className="ep-staff" onClick={() => go("/staff/login")}>Organiser portal ↗</button>
      </nav>
      <div className="ep-hero-content ep-reveal">
        <div className="ep-kicker"><i /> PRIVATE ACCESS · TICKETING · EXPERIENCES</div>
        <h1>Events that feel<br/><em>impossible to forget.</em></h1>
        <p className="ep-hero-copy">From the first invitation to the final guest leaving the room, Entria turns events into controlled, cinematic experiences — with ticketing, RSVP, guest communication, QR access, seating and live event intelligence built around the way Nigeria actually hosts.</p>
        <div className="ep-actions"><button className="ep-gold ep-pulse" onClick={() => go("#events")}>Explore live events →</button><button className="ep-ghost" onClick={() => go("/staff/login")}>Organiser access</button></div>
        <div className="ep-meta"><span>Now featuring <b>{event.name}</b></span><span>{event.date} · {event.time}</span><span>📍 {event.venue}, {event.city}</span><span>From <b>{event.price}</b></span></div>
      </div>
      <div className="ep-slider">{events.map((e, i) => <button key={e.name} className={i === index ? "active" : ""} onClick={() => setIndex(i)} aria-label={`Show ${e.name}`} />)}</div>
    </section>
  );
}

export default function EntriaPublic() {
  return <div className="entria-public">
    <Hero />

    <section id="events" className="ep-section ep-cream">
      <div className="ep-head"><div><span className="ep-label">WHAT'S HAPPENING</span><h2>Know the event.<br/><em>Before you arrive.</em></h2></div><p>No mystery landing pages. Every public event puts the information people actually need first: what it is, when it happens, exactly where it is, how much access costs, and what kind of entry is expected.</p></div>
      <div className="ep-events">
        <article className="ep-event" onClick={() => go(`/page/${events[0].slug}`)}><img src={events[0].image} alt=""/><div className="ep-event-shade"/><div className="ep-event-info"><span className="ep-event-tag">{events[0].type}</span><h3>{events[0].name}</h3><p>{events[0].date} · {events[0].time}<br/>📍 {events[0].venue}, {events[0].city}</p><div className="ep-event-price">From <strong>{events[0].price}</strong></div></div></article>
        <div className="grid gap-3">{events.slice(1).map((e) => <article key={e.name} className="ep-event small" onClick={() => go(`/page/${e.slug}`)}><img src={e.image} alt=""/><div className="ep-event-shade"/><div className="ep-event-info"><span className="ep-event-tag">{e.type}</span><h3>{e.name}</h3><p>{e.date} · {e.time}<br/>📍 {e.venue}, {e.city}</p><div className="ep-event-price">From <strong>{e.price}</strong></div></div></article>)}</div>
      </div>
    </section>

    <section id="guest-experience" className="ep-section ep-black">
      <div className="ep-head"><div><span className="ep-label">THE ENTRIA TOUCH</span><h2>Not just a ticket.<br/><em>The whole guest journey.</em></h2></div><p>Entria's original service is built around guest management, not simply transactions. That remains the heart of the product — now combined with serious ticketing, operations and financial control.</p></div>
      <div className="ep-cards">
        {["01|Personalised digital invites|Every guest can receive a branded invitation, private access code and event-specific RSVP experience.","02|RSVP & guest control|Know who is invited, who confirmed, how many guests each invitation permits and exactly who is expected.","03|WhatsApp + email communication|Automated invitations, reminders, confirmations and post-event thank-you messages keep organisers hands-free.","04|Guest POV gallery|A private event gallery lets guests share photos, videos and voice notes from their own phones without creating a public name list."].map((item) => { const [n,title,copy] = item.split("|"); return <article className="ep-card" key={n}><span className="ep-num">{n}</span><h3>{title}</h3><p>{copy}</p></article>; })}
      </div>
    </section>

    <section id="security" className="ep-section ep-cream">
      <div className="ep-showcase">
        <div className="ep-showcase-media"><img src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1400&q=88" alt="Digital event access"/><div className="ep-float"><strong>ONE SCAN. ONE ADMISSION.</strong><span>Cryptographic QR credentials · capacity enforcement · live check-in logs</span></div></div>
        <div className="ep-showcase-copy"><span className="ep-label">CONTROLLED ACCESS</span><h3>Keep the guest list at the door.</h3><p>The core business problem is simple: if one invitation can silently become five people at the gate, the organiser loses capacity control and money. Entria ties each pass to an exact permitted headcount and records entry once.</p><div className="ep-list"><div><b>01</b><span><strong>ONE-TIME QR</strong> A used credential immediately becomes invalid for another entry.</span></span></div><div><b>02</b><span><strong>HEADCOUNT ENFORCEMENT</strong> A pass for two is admission for two — not an invitation for an unlimited group.</span></div><div><b>03</b><span><strong>OFFLINE GATEKEEPER</strong> The scanner can keep an event manifest locally and queue scans when connectivity disappears.</span></span></div><div><b>04</b><span><strong>PRIVACY FIRST</strong> Gate staff see only the minimum information needed to make a safe admission decision.</span></span></div></div></div>
      </div>
    </section>

    <section className="ep-section ep-goldband">
      <div className="ep-cta"><div><span className="ep-label">FROM RSVP TO REVENUE</span><h2>A real event<br/><em>command centre.</em></h2></div><p>For organisers and internal staff, the protected portal brings events, ticket tiers, promo codes, add-ons, taxes, fees, guest lists, expenses, messaging, check-in, reports and integrations into one operational view.</p></div>
      <div className="ep-stats"><div className="ep-stat"><strong>100%</strong><span>Capacity visibility</span></div><div className="ep-stat"><strong>1×</strong><span>Admission per QR</span></div><div className="ep-stat"><strong>24/7</strong><span>Event data access</span></div><div className="ep-stat"><strong>Offline</strong><span>Gate operation mode</span></div></div>
      <div className="ep-process"><div><b>01</b><h3>Create</h3><p>Build private or public events, define capacity, ticket tiers, guest rules, branding and venue visibility.</p></div><div><b>02</b><h3>Invite / Sell</h3><p>Send personalised invitations or open ticket sales with promo codes, add-ons, taxes and fees.</p></div><div><b>03</b><h3>Verify</h3><p>Generate cryptographically secure QR credentials and validate them at the gate, online or offline.</p></div><div><b>04</b><h3>Understand</h3><p>Track attendance, revenue, costs, expenses, guest behaviour and operational performance after the event.</p></div></div>
    </section>

    <section id="faq" className="ep-section ep-black">
      <div className="ep-head"><div><span className="ep-label">FAQ</span><h2>The details<br/><em>matter.</em></h2></div><p>Entria supports weddings, private celebrations, birthdays, funerals, dinners, conferences, concerts, workshops and festivals — with the experience adjusted to the event.</p></div>
      <div className="ep-faq">
        <details open><summary>Can an event be invitation-only?</summary><p>Yes. The organiser can work from a guest list, issue private invitation links and personalised QR credentials, collect RSVP responses and enforce permitted headcount at the door.</p></details>
        <details><summary>Can we also sell normal paid tickets?</summary><p>Yes. Ticketed events support multiple pricing tiers, free tickets, add-ons, promo codes, taxes, platform fees, payment confirmation, attendee questions and digital ticket delivery.</p></details>
        <details><summary>What happens if the venue has poor internet?</summary><p>The gatekeeper PWA is designed around an offline-first manifest and queued scan synchronisation. Operational scanning remains fast and clear rather than depending on a perfect venue connection.</p></details>
        <details><summary>Can guests find their assigned table?</summary><p>Yes. A venue QR can open a private table-finder experience so guests can look up their seating without displaying a public guest list.</p></details>
        <details><summary>Can we send WhatsApp reminders?</summary><p>Yes. The platform architecture supports WhatsApp Business Cloud API and email delivery for invitations, reminders, payment confirmations, QR passes and post-event communications.</p></details>
        <details><summary>Who can access the organiser dashboard?</summary><p>The public website is separate from the protected staff portal. Only authenticated internal staff can create events, manage guests, view financials, operate check-in or administer the platform.</p></details>
      </div>
    </section>

    <section className="ep-section ep-cream"><div className="ep-cta"><div><span className="ep-label">READY WHEN YOU ARE</span><h2>Make the next event<br/><em>unforgettable.</em></h2></div><div className="ep-actions"><button className="ep-dark" onClick={() => go("/staff/login")}>Enter organiser portal →</button><a className="ep-gold" href="https://wa.me/2349063923713" target="_blank" rel="noreferrer">Talk to Entria on WhatsApp ↗</a></div></div></section>
    <footer className="ep-footer"><b>ENTRIA EVENT TECHNOLOGIES</b><span>LAGOS · NIGERIA</span><span>INVITES · RSVP · TICKETING · ACCESS · EXPERIENCE</span></footer>
  </div>;
}
