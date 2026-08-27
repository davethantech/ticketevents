import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement> & { size?: number };

function base({ size = 18, ...rest }: P, children: React.ReactNode) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  );
}

export const IGrid = (p: P) => base(p, <><rect x="3" y="3" width="7.5" height="7.5" rx="1.5" /><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5" /><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5" /><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5" /></>);
export const ITicket = (p: P) => base(p, <><path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v1.5a2.5 2.5 0 0 0 0 5V16a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1.5a2.5 2.5 0 0 0 0-5Z" /><path d="M14 6v2.2M14 11v2M14 15.8V18" strokeDasharray="0.1 3.4" /></>);
export const IUsers = (p: P) => base(p, <><circle cx="9" cy="8" r="3.2" /><path d="M3.5 19.5c.6-3.2 2.8-5 5.5-5s4.9 1.8 5.5 5" /><path d="M15.5 5.4a3.2 3.2 0 0 1 0 5.2M17.8 14.9c1.5.8 2.4 2.3 2.7 4.1" /></>);
export const IChart = (p: P) => base(p, <><path d="M4 4v16h16" /><path d="M8 15v-4M12 15V7M16 15v-6" /></>);
export const IQr = (p: P) => base(p, <><rect x="3.5" y="3.5" width="6.5" height="6.5" rx="1" /><rect x="14" y="3.5" width="6.5" height="6.5" rx="1" /><rect x="3.5" y="14" width="6.5" height="6.5" rx="1" /><path d="M14 14h3v3h-3zM20.5 14v.01M14 20.5h.01M17.5 20.5h3" /></>);
export const IMail = (p: P) => base(p, <><rect x="3" y="5.5" width="18" height="13" rx="2" /><path d="m4 7.5 8 6 8-6" /></>);
export const IGear = (p: P) => base(p, <><circle cx="12" cy="12" r="3" /><path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M18.5 5.5l-1.7 1.7M7.2 16.8l-1.7 1.7" /></>);
export const IKey = (p: P) => base(p, <><circle cx="8" cy="15" r="4" /><path d="m11 12 8.5-8.5M15 8l2.5 2.5M12.5 10.5 15 13" /></>);
export const IServer = (p: P) => base(p, <><rect x="3.5" y="4" width="17" height="7" rx="1.5" /><rect x="3.5" y="13" width="17" height="7" rx="1.5" /><path d="M7 7.5h.01M7 16.5h.01M11 7.5h3M11 16.5h3" /></>);
export const IGlobe = (p: P) => base(p, <><circle cx="12" cy="12" r="8.5" /><path d="M3.5 12h17M12 3.5c2.5 2.3 3.8 5.2 3.8 8.5S14.5 18.2 12 20.5c-2.5-2.3-3.8-5.2-3.8-8.5S9.5 5.8 12 3.5Z" /></>);
export const IPlus = (p: P) => base(p, <path d="M12 5v14M5 12h14" />);
export const ISearch = (p: P) => base(p, <><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4.5 4.5" /></>);
export const IDownload = (p: P) => base(p, <><path d="M12 4v10M7.5 10.5 12 15l4.5-4.5" /><path d="M4.5 19.5h15" /></>);
export const ICopy = (p: P) => base(p, <><rect x="8.5" y="8.5" width="12" height="12" rx="2" /><path d="M15.5 8.5V5.5a2 2 0 0 0-2-2h-8a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h3" /></>);
export const ICheck = (p: P) => base(p, <path d="m4.5 12.5 5 5L19.5 7" />);
export const IX = (p: P) => base(p, <path d="M6 6l12 12M18 6 6 18" />);
export const IChevronD = (p: P) => base(p, <path d="m6 9.5 6 6 6-6" />);
export const IChevronR = (p: P) => base(p, <path d="m9.5 6 6 6-6 6" />);
export const IEdit = (p: P) => base(p, <><path d="M13.5 5.5 18.5 10.5M4 20l1-4.5L16.5 4a1.9 1.9 0 0 1 2.7 0l.8.8a1.9 1.9 0 0 1 0 2.7L8.5 19Z" /><path d="m4 20 4.5-1" /></>);
export const ITrash = (p: P) => base(p, <><path d="M4.5 6.5h15M9.5 6V4.5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1V6" /><path d="M6.5 6.5 7.3 19a1.6 1.6 0 0 0 1.6 1.5h6.2a1.6 1.6 0 0 0 1.6-1.5l.8-12.5" /><path d="M10 10.5v6M14 10.5v6" /></>);
export const IEye = (p: P) => base(p, <><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" /><circle cx="12" cy="12" r="2.8" /></>);
export const IExternal = (p: P) => base(p, <><path d="M14 4.5h5.5V10" /><path d="M19.5 4.5 11 13" /><path d="M19.5 13.5v5a2 2 0 0 1-2 2h-11a2 2 0 0 1-2-2v-11a2 2 0 0 1 2-2h5" /></>);
export const IFilter = (p: P) => base(p, <path d="M4 6h16M7 12h10M10 18h4" />);
export const IUndo = (p: P) => base(p, <><path d="M8.5 5 4 9.5 8.5 14" /><path d="M4 9.5h10a5.5 5.5 0 1 1 0 11h-3" /></>);
export const ISend = (p: P) => base(p, <><path d="m4 11.5 16-7-4.5 16-3.7-6.3Z" /><path d="m11.8 14.2 8.2-9.7" /></>);
export const ICard = (p: P) => base(p, <><rect x="3" y="5.5" width="18" height="13" rx="2" /><path d="M3 10h18M6.5 14.5h4" /></>);
export const ICalendar = (p: P) => base(p, <><rect x="3.5" y="5" width="17" height="15.5" rx="2" /><path d="M3.5 9.5h17M8 3v4M16 3v4" /></>);
export const IPin = (p: P) => base(p, <><path d="M12 21s6.5-5.6 6.5-10.5a6.5 6.5 0 1 0-13 0C5.5 15.4 12 21 12 21Z" /><circle cx="12" cy="10.3" r="2.3" /></>);
export const IClock = (p: P) => base(p, <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>);
export const ITag = (p: P) => base(p, <><path d="m3.5 12.5 8-8H20v8.5l-8 8a2 2 0 0 1-2.8 0l-5.7-5.7a2 2 0 0 1 0-2.8Z" /><circle cx="16" cy="8" r="1.4" /></>);
export const IAlert = (p: P) => base(p, <><path d="M12 4 2.8 19.5h18.4Z" /><path d="M12 10v4M12 16.8v.01" /></>);
export const ITerminal = (p: P) => base(p, <><rect x="3" y="4.5" width="18" height="15" rx="2" /><path d="m7 9 3 3-3 3M12.5 15.5H17" /></>);
export const IBox = (p: P) => base(p, <><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9Z" /><path d="m4 7.5 8 4.5 8-4.5M12 12v9" /></>);
export const IShield = (p: P) => base(p, <><path d="M12 3.5 5 6v5.5c0 4.5 3 7.6 7 9 4-1.4 7-4.5 7-9V6Z" /><path d="m9 11.5 2.2 2.2L15.5 9" /></>);
export const IDot = (p: P) => base(p, <circle cx="12" cy="12" r="4" fill="currentColor" stroke="none" />);
export const IRefund = (p: P) => base(p, <><path d="M9 5 4.5 9.5 9 14" /><path d="M4.5 9.5H15a4.75 4.75 0 0 1 0 9.5h-4" /><path d="M14 4.5v.01M17.5 6v.01" /></>);
export const IScan = (p: P) => base(p, <><path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2" /><path d="M4 12h16" /></>);
export const ISpark = (p: P) => base(p, <><path d="M12 3.5 13.8 9 19.5 11 13.8 13 12 18.5 10.2 13 4.5 11 10.2 9Z" /><path d="M18.5 3.5v3M17 5h3" /></>);
export const IArrowR = (p: P) => base(p, <><path d="M4.5 12h15" /><path d="m13.5 6 6 6-6 6" /></>);
export const IWifi = (p: P) => base(p, <><path d="M3 9.5C8 5 16 5 21 9.5M6.5 13c3.2-2.8 7.8-2.8 11 0M9.7 16.2a3.6 3.6 0 0 1 4.6 0" /><circle cx="12" cy="19" r="1" fill="currentColor" stroke="none" /></>);
export const ILayers = (p: P) => base(p, <><path d="m12 3.5 8.5 4.5L12 12.5 3.5 8Z" /><path d="m4.5 12.5 7.5 4 7.5-4M4.5 16.5l7.5 4 7.5-4" /></>);
export const IWallet = (p: P) => base(p, <><path d="M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5v9a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 16.5Z" /><path d="M20 10h-4.5a2 2 0 0 0 0 4H20" /></>);

/** Brand mark: perforated ticket stub */
export function LogoMark({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect x="2" y="6" width="28" height="20" rx="5" fill="#e8431f" />
      <circle cx="2" cy="16" r="3.2" fill="#141917" />
      <circle cx="30" cy="16" r="3.2" fill="#141917" />
      <path d="M13 6v20" stroke="#fbfbf8" strokeWidth="1.6" strokeDasharray="2.4 3" />
      <path d="M18 12h7M18 16h5M18 20h6.5" stroke="#fbfbf8" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
