import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import EntriaLanding, { StaffLogin } from "./views/EntriaLanding";

const hasStaffSession = () => sessionStorage.getItem("entria:staff-session") === "preview-authenticated";

function Root() {
  const [hash, setHash] = useState(() => window.location.hash);
  const [staff, setStaff] = useState(() => hasStaffSession());

  useEffect(() => {
    const onHashChange = () => {
      setHash(window.location.hash);
      setStaff(hasStaffSession());
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const path = (hash.replace(/^#/, "") || "/").split("?")[0];
  const isRoot = path === "/";
  const isStaffLogin = path === "/staff/login";
  const isPublicGuestRoute = path === "/page" || path.startsWith("/page/") || path === "/embed" || path.startsWith("/embed/");

  // Public website: normal visitors never enter the organizer application.
  if (isRoot && !staff) {
    return (
      <EntriaLanding
        onCreateEvent={() => { window.location.hash = "/staff/login"; }}
        onExplore={() => { document.getElementById("how")?.scrollIntoView({ behavior: "smooth" }); }}
      />
    );
  }

  // Explicit internal staff entry point.
  if (isStaffLogin && !staff) {
    return <StaffLogin onBack={() => { window.location.hash = "/"; }} onSuccess={() => { setStaff(true); window.location.hash = "/"; }} />;
  }

  // Public guest-facing event pages and embedded widgets remain accessible without staff auth.
  if (isPublicGuestRoute) return <App />;

  // Everything else is an internal organizer/staff route.
  if (!staff) {
    window.location.hash = "/staff/login";
    return null;
  }

  return <App />;
}

ReactDOM.createRoot(document.getElementById("root")!).render(<Root />);
