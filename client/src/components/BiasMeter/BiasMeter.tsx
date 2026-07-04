import './BiasMeter.css';
import { useAnimatedValue } from '../../hooks/useAnimatedValue';

// ─── Props ────────────────────────────────────────────────────────────────────

interface BiasMeterProps {
  /** Bias score in the range -100 to +100 */
  biasScore: number;
  /** Optional short rationale text accompanying the score */
  biasRationale?: string;
}

// ─── Pure helper — exported for unit / property-based tests ───────────────────

/**
 * Returns the color zone for a given bias score.
 *
 * - "blue"  → score < -20  (left-leaning)
 * - "grey"  → -20 ≤ score ≤ +20  (neutral)
 * - "red"   → score > +20  (right-leaning)
 */
export function getBiasZone(score: number): 'blue' | 'grey' | 'red' {
  if (score < -20) return 'blue';
  if (score > 20) return 'red';
  return 'grey';
}

// ─── Zone metadata (text labels satisfy WCAG 10.4 / Req 10.4) ────────────────

const ZONE_META: Record<
  'blue' | 'grey' | 'red',
  { label: string; description: string }
> = {
  blue: {
    label: 'Left-leaning',
    description: 'Score indicates a left-leaning or progressive bias',
  },
  grey: {
    label: 'Neutral',
    description: 'Score indicates a broadly neutral or centrist bias',
  },
  red: {
    label: 'Right-leaning',
    description: 'Score indicates a right-leaning or conservative bias',
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * BiasMeter
 *
 * Renders a horizontal scale from -100 (Left) to +100 (Right).
 * The indicator animates from 0 to `biasScore` over 1000 ms using
 * `useAnimatedValue`. Changing `biasScore` resets the animation to 0
 * before re-animating (Req 3.7).
 *
 * Color zones (Req 3.4):
 *   blue  → score < -20
 *   grey  → -20 ≤ score ≤ +20
 *   red   → score > +20
 *
 * Text labels accompany each zone so information is not conveyed by
 * color alone (Req 10.4 / WCAG 1.4.1).
 */
export function BiasMeter({ biasScore, biasRationale }: BiasMeterProps) {
  // Animate from 0 → biasScore over 1000 ms (within the 800–1200 ms range).
  // useAnimatedValue resets to startValue (0) whenever endValue changes,
  // satisfying Req 3.7 (reset to neutral before each new animation).
  const animatedScore = useAnimatedValue(0, biasScore, 1000);

  // Indicator position as a percentage along the track (0 % = far left, 100 % = far right)
  const positionPercent = ((animatedScore + 100) / 200) * 100;

  const zone = getBiasZone(animatedScore);
  const zoneMeta = ZONE_META[zone];

  // Round the displayed numeric score to one decimal place for readability
  const displayScore = Math.round(animatedScore * 10) / 10;

  return (
    <section
      className="bias-meter"
      aria-label="Media bias meter"
    >
      {/* ── Header row: title + numeric score (Req 3.5) ── */}
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold text-white/80 uppercase tracking-wide">
          Media Bias
        </h2>

        {/* Numeric score with zone label — satisfies Req 3.5 and Req 10.4 */}
        <div
          className="flex items-center gap-2"
          aria-live="polite"
          aria-atomic="true"
          aria-label={`Bias score: ${Math.round(biasScore)}, ${zoneMeta.label}`}
        >
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              zone === 'blue'
                ? 'bg-blue-500/20 text-blue-300'
                : zone === 'red'
                ? 'bg-red-500/20 text-red-300'
                : 'bg-gray-500/20 text-gray-300'
            }`}
          >
            {zoneMeta.label}
          </span>
          <span
            className={`text-lg font-bold tabular-nums ${
              zone === 'blue'
                ? 'text-blue-400'
                : zone === 'red'
                ? 'text-red-400'
                : 'text-gray-300'
            }`}
          >
            {displayScore > 0 ? `+${displayScore}` : displayScore}
          </span>
        </div>
      </div>

      {/* ── Track with color zones and moving indicator ── */}
      <div
        className="bias-meter__track"
        role="img"
        aria-label={`Bias meter showing score of ${Math.round(biasScore)} (${zoneMeta.description})`}
      >
        {/* Texture patterns for left and right zones (WCAG non-color cue) */}
        <div className="bias-meter__zone-pattern" aria-hidden="true" />

        {/* Moving indicator */}
        <div
          className={`bias-meter__indicator bias-meter__indicator--${zone}`}
          style={{ left: `${positionPercent}%` }}
          aria-hidden="true"
        />
      </div>

      {/* ── End labels: Left / Right (Req 3.2) ── */}
      <div className="flex justify-between mt-1" aria-hidden="true">
        <span className="text-xs text-blue-400 font-medium">◀ Left</span>
        <span className="text-xs text-gray-400 font-medium">Center</span>
        <span className="text-xs text-red-400 font-medium">Right ▶</span>
      </div>

      {/* ── Scale tick marks ── */}
      <div className="flex justify-between px-0 mt-0.5" aria-hidden="true">
        <span className="text-xs text-white/30">-100</span>
        <span className="text-xs text-white/30">-50</span>
        <span className="text-xs text-white/30">0</span>
        <span className="text-xs text-white/30">+50</span>
        <span className="text-xs text-white/30">+100</span>
      </div>

      {/* ── Optional rationale text (Req 3.6) ── */}
      {biasRationale && (
        <p className="mt-3 text-sm text-white/60 leading-relaxed">
          {biasRationale}
        </p>
      )}
    </section>
  );
}

export default BiasMeter;
