import { FormEvent, useState } from "react";
import { signInStaff } from "../lib/auth";

export default function StaffLogin({ onBack }: { onBack: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setError(""); setBusy(true);
    const result = await signInStaff(email.trim(), password);
    setBusy(false);
    if (!result.ok) { setError(result.error || "Unable to sign in"); return; }
    sessionStorage.setItem("entria:staff-email", email.trim());
    window.location.hash = "/dashboard";
    window.location.reload();
  };
  return <div className="min-h-screen bg-[#070807] text-white">
    <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-5 py-12">
      <div className="grid w-full overflow-hidden rounded-[28px] border border-white/10 bg-[#10120f] shadow-2xl lg:grid-cols-[1.05fr_.95fr]">
        <div className="relative hidden min-h-[640px] overflow-hidden lg:block">
          <img src="https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1400&q=88" alt="" className="absolute inset-0 h-full w-full object-cover opacity-60" />
          <div className="absolute inset-0 bg-gradient-to-br from-black/85 via-black/45 to-[#b78b3d]/30" />
          <div className="relative flex h-full flex-col justify-between p-10"><div><span className="text-[10px] font-black uppercase tracking-[.3em] text-[#e8c675]">PRIVATE STAFF PORTAL</span><h1 className="mt-6 max-w-md font-display text-6xl font-black leading-[.88] tracking-[-.06em]">Run the event.<br/><span className="text-[#e8c675]">Own the door.</span></h1><p className="mt-6 max-w-md text-sm leading-7 text-white/65">Internal access for organisers, event managers and gate staff. Guests never enter this workspace.</p></div><div className="text-[10px] uppercase tracking-[.18em] text-white/40">ENTRIA EVENT TECHNOLOGIES · LAGOS</div></div>
        </div>
        <form onSubmit={submit} className="flex min-h-[640px] flex-col justify-center p-7 sm:p-12">
          <button type="button" onClick={onBack} className="mb-12 self-start text-xs font-bold uppercase tracking-[.16em] text-white/45 hover:text-white">← Back to public site</button>
          <span className="text-[10px] font-black uppercase tracking-[.28em] text-[#d9b865]">AUTHENTICATED ACCESS</span>
          <h2 className="mt-4 font-display text-4xl font-black tracking-tight">Welcome back.</h2>
          <p className="mt-2 text-sm leading-6 text-white/50">Sign in with your internal staff account.</p>
          <label className="mt-9 text-[10px] font-black uppercase tracking-[.16em] text-white/45">Work email<input value={email} onChange={e=>setEmail(e.target.value)} type="email" autoComplete="username" required className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-white/[.04] px-4 text-sm outline-none transition focus:border-[#e8c675]/70" placeholder="name@company.com" /></label>
          <label className="mt-5 text-[10px] font-black uppercase tracking-[.16em] text-white/45">Password<input value={password} onChange={e=>setPassword(e.target.value)} type="password" autoComplete="current-password" required className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-white/[.04] px-4 text-sm outline-none transition focus:border-[#e8c675]/70" placeholder="••••••••" /></label>
          {error && <div className="mt-4 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-xs font-semibold text-red-300">{error}</div>}
          <button disabled={busy} className="mt-7 h-12 rounded-xl bg-[#e8c675] text-xs font-black uppercase tracking-[.16em] text-[#14120d] transition hover:-translate-y-0.5 disabled:opacity-50">{busy ? "Authenticating…" : "Enter staff portal →"}</button>
          <p className="mt-5 text-center text-[11px] leading-5 text-white/35">Protected by Supabase authentication and role-based database policies.</p>
        </form>
      </div>
    </div>
  </div>;
}
