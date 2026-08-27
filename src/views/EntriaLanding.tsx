import { useState } from "react";
import EntriaExperience from "../components/EntriaExperience";
import { LogoMark } from "../components/icons";
import { signInStaff, supabase } from "../lib/auth";

export default function EntriaLanding({ onCreateEvent, onExplore }: { onCreateEvent?: () => void; onExplore?: () => void }) {
  return <EntriaExperience onCreateEvent={onCreateEvent} onExplore={onExplore} />;
}

export function StaffLogin({ onSuccess, onBack }: { onSuccess: () => void; onBack: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password.trim()) return setError("Enter your staff email and password.");
    if (!supabase) return setError("Production authentication is not configured. Use demo staff access for the presentation build.");
    setBusy(true);
    const result = await signInStaff(email.trim(), password);
    setBusy(false);
    if (!result.ok) return setError(result.error || "Unable to sign in.");
    sessionStorage.setItem("entria:staff-session", "authenticated");
    sessionStorage.setItem("entria:staff-email", email.trim());
    onSuccess();
  };

  const demo = () => {
    setPreview(true);
    sessionStorage.setItem("entria:staff-session", "preview-authenticated");
    sessionStorage.setItem("entria:staff-email", "staff@entria4events.com");
    onSuccess();
  };

  return (
    <div className="min-h-screen overflow-hidden bg-[#070907] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(10,112,91,.22),transparent_32%),radial-gradient(circle_at_80%_25%,rgba(218,177,84,.18),transparent_30%),#070907]" />
      <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.045)_1px,transparent_1px)] [background-size:64px_64px]" />
      <div className="relative mx-auto flex min-h-screen max-w-[1280px] items-center justify-center px-5 py-10">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-[34px] border border-white/10 bg-white/[.045] shadow-[0_50px_140px_rgba(0,0,0,.55)] backdrop-blur-xl lg:grid-cols-[1.05fr_.95fr]">
          <div className="relative hidden min-h-[680px] overflow-hidden border-r border-white/10 p-10 lg:block">
            <div className="absolute -left-24 top-20 h-80 w-80 rounded-full bg-emerald-400/10 blur-[90px]" /><div className="absolute -right-20 bottom-10 h-96 w-96 rounded-full bg-amber-300/10 blur-[100px]" />
            <div className="relative flex h-full flex-col justify-between">
              <div className="flex items-center gap-3"><LogoMark size={38}/><div><div className="font-display text-xl font-black tracking-[.2em]">ENTRIA</div><div className="text-[8px] uppercase tracking-[.3em] text-white/30">Internal operations</div></div></div>
              <div><div className="mb-5 text-[9px] font-bold uppercase tracking-[.28em] text-amber-200/60">Private staff portal</div><h1 className="font-display text-6xl font-black leading-[.88] tracking-[-.05em]">CONTROL<br/><span className="text-amber-200">THE GATE.</span></h1><p className="mt-6 max-w-md text-sm leading-7 text-white/45">Create events, manage guest lists, send invitations, monitor capacity and operate QR check-in from one protected workspace.</p><div className="mt-10 grid grid-cols-2 gap-3">{["Event creation","Guest intelligence","QR check-in","Live reporting"].map(x=><div key={x} className="rounded-2xl border border-white/10 bg-white/[.035] px-4 py-4 text-[10px] font-bold uppercase tracking-[.16em] text-white/55">{x}</div>)}</div></div>
              <div className="text-[9px] uppercase tracking-[.2em] text-white/25">Authorized organizers & event staff only</div>
            </div>
          </div>
          <div className="flex min-h-[680px] flex-col justify-center p-7 sm:p-10">
            <button onClick={onBack} className="mb-10 w-fit text-[10px] font-bold uppercase tracking-[.2em] text-white/35 transition hover:text-white/70">← Back to public site</button>
            <div className="mb-8 lg:hidden"><LogoMark size={34}/></div>
            <div className="mb-8"><div className="text-[9px] font-bold uppercase tracking-[.25em] text-emerald-200/60">Staff access</div><h2 className="mt-3 font-display text-4xl font-black tracking-[-.04em]">Sign in to operations.</h2><p className="mt-3 text-sm leading-6 text-white/40">This is where authorized staff create and manage events. Guests never enter this workspace.</p></div>
            <form onSubmit={submit} className="space-y-4">
              <label className="block"><span className="mb-2 block text-[10px] font-bold uppercase tracking-[.18em] text-white/40">Staff email</span><input value={email} onChange={e=>setEmail(e.target.value)} type="email" autoComplete="username" placeholder="you@company.com" className="h-12 w-full rounded-xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-amber-200/40" /></label>
              <label className="block"><span className="mb-2 block text-[10px] font-bold uppercase tracking-[.18em] text-white/40">Password</span><input value={password} onChange={e=>setPassword(e.target.value)} type="password" autoComplete="current-password" placeholder="••••••••" className="h-12 w-full rounded-xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-amber-200/40" /></label>
              {error&&<div className="rounded-xl border border-red-300/20 bg-red-300/10 px-4 py-3 text-xs text-red-100">{error}</div>}
              <button disabled={busy} type="submit" className="h-12 w-full rounded-xl bg-white text-[11px] font-black uppercase tracking-[.18em] text-black transition hover:-translate-y-0.5 disabled:opacity-50">{busy?"Authenticating…":"Sign in"}</button>
            </form>
            {!supabase&&<><div className="my-6 flex items-center gap-3"><span className="h-px flex-1 bg-white/10"/><span className="text-[9px] uppercase tracking-[.2em] text-white/20">presentation build</span><span className="h-px flex-1 bg-white/10"/></div><button onClick={demo} className="h-11 w-full rounded-xl border border-amber-200/20 bg-amber-100/[.05] text-[10px] font-bold uppercase tracking-[.16em] text-amber-100/80 transition hover:bg-amber-100/10">{preview?"Opening staff workspace…":"Use demo staff access"}</button></>}
            <p className="mt-5 text-center text-[9px] leading-5 text-white/25">Guests never access this workspace. Production authentication and authorization are enforced through Supabase when configured.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
