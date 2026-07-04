import type { ConflictBackground } from '../../types/analysis';

interface ConflictBackgroundCardProps {
  conflictBackground: ConflictBackground;
}

export function ConflictBackgroundCard({ conflictBackground }: ConflictBackgroundCardProps) {
  return (
    <section
      className="conflict-background-card rounded-2xl bg-white/5 backdrop-blur-md border border-white/15 p-5"
      aria-label="Conflict background"
    >
      <h2 className="text-sm font-semibold text-white/80 uppercase tracking-wide mb-4">
        Conflict Background
      </h2>

      <p className="text-sm text-white/60 leading-relaxed mb-4">
        {conflictBackground.historicalSummary}
      </p>

      <h3 className="text-xs font-semibold text-white/70 uppercase tracking-wide mb-2">
        Key Players
      </h3>

      <ul className="space-y-2" aria-label="Key players">
        {conflictBackground.keyPlayers.map((player, index) => (
          <li
            key={index}
            className="flex gap-2 rounded-lg bg-white/5 border border-white/10 p-3"
          >
            <span className="font-semibold text-sm text-white/90">{player.name}</span>
            <span className="text-sm text-white/60">— {player.role}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default ConflictBackgroundCard;
