import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import EntriaPublic from "./views/EntriaPublic";
import { StaffLogin } from "./views/EntriaLanding";
import { restoreStaffSession } from "./lib/auth";

const hasPreviewSession = () => sessionStorage.getItem("entria:staff-session") === "preview-authenticated";

function Root() {
  const [hash, setHash] = useState(() => window.location.hash);
  const [staff, setStaff] = useState(() => hasPreviewSession());
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    let mounted = true;
    restoreStaffSession().then(ok => { if (mounted) { setStaff(ok); setBooting(false); } });
    const onHashChange = () => setHash(window.location.hash);
    window.addEventListener("hashchange", onHashChange);
    return () => { mounted = false; window.removeEventListener("hashchange", onHashChange); };
  }, []);

  const path = (hash.replace(/^#/, "") || "/").split("?")[0];
  const isRoot = path === "/";
  const isStaffLogin = path === "/staff/login";
  const isPublicGuestRoute = path === "/page" || path.startsWith("/page/") || path === "/embed" || path.startsWith("/embed/");

  if (booting && !isPublicGuestRoute) return <div className="flex min-h-screen items-center justify-center bg-[#070907] text-white"><div className="text-center"><div className="font-display text-2xl font-black tracking-[.2em]">ENTRIA</div><div className="mt-2 text-[9px] uppercase tracking-[.25em] text-white/30">Securing staff workspace</div></div></div>;

  if (isRoot && !staff) return <EntriaPublic />;

  if (isStaffLogin && !staff) return <StaffLogin onBack={() => { window.location.hash = "/"; }} onSuccess={() => { setStaff(true); window.location.hash = "/dashboard"; }} />;

  if (isPublicGuestRoute) return <App />;

  if (!staff) {
    window.location.hash = "/staff/login";
    return null;
  }

  return <App />;
}

ReactDOM.createRoot(document.getElementById("root")!).render(<Root />);
