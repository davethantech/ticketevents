import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import EntriaLanding from "./views/EntriaLanding";

function Root() {
  const [hash, setHash] = useState(() => window.location.hash);

  useEffect(() => {
    const onHashChange = () => setHash(window.location.hash);
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  // Public root: cinematic Entria experience. Existing organizer routes remain available.
  if (!hash || hash === "#" || hash === "#/") {
    return (
      <EntriaLanding
        onCreateEvent={() => { window.location.hash = "/events"; }}
        onExplore={() => { window.location.hash = "/events"; }}
      />
    );
  }

  return <App />;
}

ReactDOM.createRoot(document.getElementById("root")!).render(<Root />);
