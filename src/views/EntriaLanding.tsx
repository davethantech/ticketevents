import EntriaExperience from "../components/EntriaExperience";

export default function EntriaLanding({ onCreateEvent, onExplore }: { onCreateEvent?: () => void; onExplore?: () => void }) {
  return <EntriaExperience onCreateEvent={onCreateEvent} onExplore={onExplore} />;
}
