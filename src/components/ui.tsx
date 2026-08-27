import { createContext, useContext, useEffect, useRef, useState } from "react";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import QRCode from "qrcode";
import { cx } from "../lib/utils";
import { ICheck, ICopy, IX } from "./icons";

/* ---------------------------------------------------------------- */
/* Toasts                                                            */
/* ---------------------------------------------------------------- */

export interface ToastMsg {
  id: number;
  title: string;
  desc?: string;
  kind: "ok" | "bad" | "info";
}

const ToastCtx = createContext<{ push: (t: Omit<ToastMsg, "id">) => void } | null>(null);
let toastId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  const push = (t: Omit<ToastMsg, "id">) => {
    toastId += 1;
    const id = toastId;
    setToasts((cur) => [...cur.slice(-3), { ...t, id }]);
    window.setTimeout(() => setToasts((cur) => cur.filter((x) => x.id !== id)), 3800);
  };
  return (
    <ToastCtx.Provider value={{ push }}>
      {children}
      <div className="fixed bottom-5 right-5 z-[90] flex w-[320px] flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cx(
              "toast-in flex items-start gap-3 rounded-lg border px-4 py-3 shadow-[var(--shadow-pop)] backdrop-blur",
              t.kind === "ok" && "border-ok/30 bg-[#12291d]/95 text-[#d7efdf]",
              t.kind === "bad" && "border-bad/40 bg-[#331512]/95 text-[#f6dcd8]",
              t.kind === "info" && "border-nightline bg-night/95 text-[#e4e8e2]",
            )}
          >
            <span
              className={cx(
                "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                t.kind === "ok" && "bg-ok text-white",
                t.kind === "bad" && "bg-bad text-white",
                t.kind === "info" && "bg-flame text-white",
              )}
            >
              {t.kind === "bad" ? <IX size={11} /> : <ICheck size={11} />}
            </span>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold leading-tight">{t.title}</p>
              {t.desc && <p className="mt-0.5 text-[12px] leading-snug opacity-75">{t.desc}</p>}
            </div>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("ToastProvider missing");
  return ctx.push;
}

/* ---------------------------------------------------------------- */
/* Reveal + count-up                                                 */
/* ---------------------------------------------------------------- */

export function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { threshold: 0.12 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} className={cx("reveal", inView && "is-in", className)} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

export function useCountUp(target: number, duration = 700): number {
  const [val, setVal] = useState(0);
  const prev = useRef(0);
  useEffect(() => {
    const from = prev.current;
    prev.current = target;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(from + (target - from) * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return val;
}

/* ---------------------------------------------------------------- */
/* Buttons & badges                                                  */
/* ---------------------------------------------------------------- */

type BtnVariant = "primary" | "dark" | "ghost" | "outline" | "danger" | "teal";

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; size?: "sm" | "md" | "lg" }) {
  return (
    <button
      className={cx(
        "focus-ring inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all duration-150 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-45",
        size === "sm" && "h-8 px-3 text-[12.5px]",
        size === "md" && "h-10 px-4 text-[13.5px]",
        size === "lg" && "h-12 px-6 text-[15px]",
        variant === "primary" && "bg-flame text-white shadow-[0_2px_0_rgb(150_35_10)] hover:bg-[#d63a17]",
        variant === "dark" && "bg-night text-[#f0f2ee] hover:bg-night2",
        variant === "teal" && "bg-teal text-white hover:bg-[#0b5a50]",
        variant === "ghost" && "text-ink2 hover:bg-ink/[0.06]",
        variant === "outline" && "border border-line2 bg-paper text-ink hover:border-faint hover:bg-white",
        variant === "danger" && "bg-baddim text-bad hover:bg-[#f3d3ce]",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

export function Badge({ tone = "neutral", children, className }: { tone?: "neutral" | "ok" | "warn" | "bad" | "flame" | "teal" | "night"; children: ReactNode; className?: string }) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide",
        tone === "neutral" && "border-line bg-white/70 text-ink2",
        tone === "ok" && "border-ok/25 bg-okdim text-ok",
        tone === "warn" && "border-warn/25 bg-warndim text-warn",
        tone === "bad" && "border-bad/25 bg-baddim text-bad",
        tone === "flame" && "border-flame/25 bg-flamedim text-flame",
        tone === "teal" && "border-teal/25 bg-tealdim text-teal",
        tone === "night" && "border-nightline bg-night text-[#e7eae4]",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function StatusPill({ status }: { status: string }) {
  const map: Record<string, { tone: "ok" | "warn" | "bad" | "flame" | "teal" | "neutral"; label: string }> = {
    live: { tone: "ok", label: "● Live" },
    draft: { tone: "warn", label: "Draft" },
    ended: { tone: "neutral", label: "Ended" },
    paid: { tone: "teal", label: "Paid" },
    free: { tone: "neutral", label: "Free" },
    refunded: { tone: "bad", label: "Refunded" },
    active: { tone: "ok", label: "Active" },
    invited: { tone: "warn", label: "Invited" },
  };
  const m = map[status] ?? { tone: "neutral" as const, label: status };
  return <Badge tone={m.tone}>{m.label}</Badge>;
}

/* ---------------------------------------------------------------- */
/* Form bits                                                         */
/* ---------------------------------------------------------------- */

export function Field({ label, hint, children, className }: { label: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <label className={cx("block", className)}>
      <span className="mb-1.5 flex items-baseline justify-between text-[12px] font-semibold tracking-wide text-ink2">
        {label}
        {hint && <span className="font-normal text-faint">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

const inputCls =
  "focus-ring h-10 w-full rounded-lg border border-line2 bg-white px-3 text-[13.5px] text-ink placeholder:text-faint transition-colors hover:border-faint focus:border-flame";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cx(inputCls, props.className)} />;
}
export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cx(inputCls, "cursor-pointer pr-7", props.className)} />;
}
export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cx(inputCls, "h-auto min-h-[88px] py-2.5 leading-relaxed", props.className)} />;
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="focus-ring group inline-flex items-center gap-2.5 rounded-full"
      aria-pressed={checked}
    >
      <span
        className={cx(
          "relative h-[22px] w-[40px] rounded-full transition-colors duration-200",
          checked ? "bg-teal" : "bg-line2 group-hover:bg-faint",
        )}
      >
        <span
          className={cx(
            "absolute top-[3px] h-4 w-4 rounded-full bg-white shadow transition-all duration-200",
            checked ? "left-[21px]" : "left-[3px]",
          )}
        />
      </span>
      {label && <span className="text-[13px] font-medium text-ink2">{label}</span>}
    </button>
  );
}

export function Segmented<T extends string>({ options, value, onChange }: { options: Array<{ value: T; label: string }>; value: T; onChange: (v: T) => void }) {
  return (
    <div className="inline-flex rounded-lg border border-line2 bg-white p-1">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cx(
            "rounded-md px-3.5 py-1.5 text-[12.5px] font-semibold transition-all duration-150",
            value === o.value ? "bg-night text-white shadow-sm" : "text-mut hover:text-ink",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Surfaces                                                          */
/* ---------------------------------------------------------------- */

export function Card({ children, className, hover }: { children: ReactNode; className?: string; hover?: boolean }) {
  return (
    <div
      className={cx(
        "rounded-xl border border-line bg-paper shadow-[var(--shadow-lift)]",
        hover && "transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-pop)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-night/55 backdrop-blur-[2px]" onClick={onClose} />
      <div className={cx("pop-in relative max-h-[88vh] w-full overflow-y-auto rounded-xl border border-line bg-paper shadow-[var(--shadow-pop)]", wide ? "max-w-2xl" : "max-w-md")}>
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-paper/95 px-5 py-3.5 backdrop-blur">
          <h3 className="font-display text-[17px] font-bold tracking-tight">{title}</h3>
          <button onClick={onClose} className="focus-ring rounded-md p-1.5 text-mut transition-colors hover:bg-ink/5 hover:text-ink">
            <IX size={16} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function EmptyState({ icon, title, desc, action }: { icon: ReactNode; title: string; desc: string; action?: ReactNode }) {
  return (
    <div className="stripe-hatch flex flex-col items-center rounded-xl border border-dashed border-line2 px-6 py-14 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-line bg-white text-mut">{icon}</div>
      <p className="font-display text-[16px] font-bold">{title}</p>
      <p className="mt-1 max-w-sm text-[13px] leading-relaxed text-mut">{desc}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ProgressBar({ value, color = "var(--color-flame)", className }: { value: number; color?: string; className?: string }) {
  return (
    <div className={cx("h-1.5 w-full overflow-hidden rounded-full bg-ink/[0.08]", className)}>
      <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${Math.min(100, value)}%`, background: color }} />
    </div>
  );
}

export function Avatar({ name, color, size = 32 }: { name: string; color: string; size?: number }) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full font-display font-bold text-white"
      style={{ width: size, height: size, background: color, fontSize: size * 0.36 }}
    >
      {initials}
    </span>
  );
}

export function CopyButton({ text, label = "Copy", small }: { text: string; label?: string; small?: boolean }) {
  const [done, setDone] = useState(false);
  return (
    <Button
      variant={done ? "teal" : "outline"}
      size={small ? "sm" : "md"}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
        } catch {
          const ta = document.createElement("textarea");
          ta.value = text;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          ta.remove();
        }
        setDone(true);
        setTimeout(() => setDone(false), 1600);
      }}
    >
      {done ? <ICheck size={14} /> : <ICopy size={14} />}
      {done ? "Copied" : label}
    </Button>
  );
}

/* ---------------------------------------------------------------- */
/* Charts (hand-rolled SVG)                                          */
/* ---------------------------------------------------------------- */

export function Sparkline({ data, width = 120, height = 34, color = "var(--color-flame)" }: { data: number[]; width?: number; height?: number; color?: string }) {
  if (data.length < 2) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * (width - 2) + 1;
    const y = height - 3 - ((v - min) / (max - min || 1)) * (height - 8);
    return `${x},${y}`;
  });
  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline points={`1,${height - 2} ${pts.join(" ")} ${width - 1},${height - 2}`} fill={color} opacity={0.1} stroke="none" />
      <polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length - 1].split(",")[0]} cy={pts[pts.length - 1].split(",")[1]} r={2.6} fill={color} />
    </svg>
  );
}

export function Bars({ data, labels, height = 160, color = "var(--color-teal)", moneyFn }: { data: number[]; labels: string[]; height?: number; color?: string; moneyFn?: (n: number) => string }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(t);
  }, []);
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-[3px]" style={{ height }}>
      {data.map((v, i) => (
        <div key={i} className="group relative flex h-full flex-1 flex-col justify-end">
          <div className="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md bg-night px-2 py-1 text-[11px] font-semibold text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
            {labels[i]}: {moneyFn ? moneyFn(v) : v}
          </div>
          <div
            className="w-full origin-bottom rounded-t-[3px] transition-colors group-hover:opacity-80"
            style={{
              height: mounted ? `${Math.max(2, (v / max) * 100)}%` : "2px",
              background: v > 0 ? color : "var(--color-line)",
              transition: "height 0.7s cubic-bezier(0.2,0.7,0.3,1)",
              transitionDelay: `${i * 18}ms`,
            }}
          />
        </div>
      ))}
    </div>
  );
}

export function Donut({ segments, size = 148, thickness = 20, centerLabel, centerSub }: { segments: Array<{ value: number; color: string; label: string }>; size?: number; thickness?: number; centerLabel?: string; centerSub?: string }) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const r = (size - thickness) / 2;
  const circ = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-line)" strokeWidth={thickness} />
        {segments.map((s, i) => {
          const len = (s.value / total) * circ;
          const el = (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth={thickness}
              strokeDasharray={`${len} ${circ - len}`}
              strokeDashoffset={-offset}
              strokeLinecap="butt"
              style={{ transition: "stroke-dasharray 0.8s cubic-bezier(0.2,0.7,0.3,1)" }}
            />
          );
          offset += len;
          return el;
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {centerLabel && <span className="font-display text-[20px] font-bold leading-none tracking-tight">{centerLabel}</span>}
        {centerSub && <span className="mt-1 text-[10.5px] font-medium uppercase tracking-widest text-faint">{centerSub}</span>}
      </div>
    </div>
  );
}

export function HBar({ label, value, max, color, display }: { label: string; value: number; max: number; color: string; display: string }) {
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-3 text-[12.5px]">
        <span className="truncate font-medium text-ink2">{label}</span>
        <span className="code-pill shrink-0 text-[11.5px] text-mut">{display}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-ink/[0.07]">
        <div className="h-full rounded-full" style={{ width: `${(value / (max || 1)) * 100}%`, background: color, animation: "widthGrow 0.8s cubic-bezier(0.2,0.7,0.3,1) both" }} />
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* QR image                                                          */
/* ---------------------------------------------------------------- */

export function QrImg({ value, size = 140, className }: { value: string; size?: number; className?: string }) {
  const [src, setSrc] = useState("");
  useEffect(() => {
    let live = true;
    QRCode.toDataURL(value, { width: size * 2, margin: 1, color: { dark: "#161a18", light: "#ffffff" } }).then((url) => {
      if (live) setSrc(url);
    });
    return () => {
      live = false;
    };
  }, [value, size]);
  if (!src) return <div className={className} style={{ width: size, height: size, background: "var(--color-line)" }} />;
  return <img src={src} alt={`QR ${value}`} width={size} height={size} className={cx("rounded-md", className)} />;
}
