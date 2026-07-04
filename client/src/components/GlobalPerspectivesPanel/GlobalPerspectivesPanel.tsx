import './GlobalPerspectivesPanel.css';
import { countryCodeToFlagEmoji, getFlagAriaLabel } from '../../utils/countryCode';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CountryPerspective {
  countryCode: string;   // ISO 3166-1 alpha-2 (e.g. "US", "CN")
  countryName: string;
  summary: string;       // ≤ 60 words
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface GlobalPerspectivesPanelProps {
  /** Array of country perspectives from the Analyzer (≥ 4 items) */
  perspectives: CountryPerspective[];
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * GlobalPerspectivesPanel
 *
 * Renders each `CountryPerspective` as a glassmorphism card containing:
 *   - A flag emoji (derived from ISO 3166-1 alpha-2 code) with an accessible
 *     aria-label (Req 5.3, 10.5)
 *   - The country or region name (Req 5.2)
 *   - A summary of that country's framing of the story (Req 5.2, 5.5)
 *
 * Layout (Req 5.6, 5.7):
 *   - ≥ 768px viewport: 2-column grid
 *   - < 768px viewport: single-column layout
 *
 * Entrance animation (Req 5.4):
 *   Each card fades in and slides up with a staggered delay of 150 ms per card,
 *   driven by an inline `animationDelay` style and the `perspective-card-enter`
 *   CSS animation defined in GlobalPerspectivesPanel.css.
 *
 * Glassmorphism styling matches the rest of the ClearLens UI (Req 8.2, 8.3).
 */
export function GlobalPerspectivesPanel({ perspectives }: GlobalPerspectivesPanelProps) {
  return (
    <section
      className="
        rounded-2xl
        bg-white/5
        backdrop-blur-md
        border border-white/15
        p-5
      "
      aria-label="Global perspectives"
    >
      {/* ── Section header ── */}
      <h2 className="text-sm font-semibold text-white/80 uppercase tracking-wide mb-4">
        Global Perspectives
      </h2>

      {/* ── Perspective cards grid (Req 5.6, 5.7) ── */}
      <div className="perspectives-grid">
        {perspectives.map((perspective, index) => {
          const flagEmoji = countryCodeToFlagEmoji(perspective.countryCode);
          const flagLabel = getFlagAriaLabel(perspective.countryName);

          return (
            <article
              key={`${perspective.countryCode}-${index}`}
              className="
                perspective-card
                rounded-xl
                bg-white/5
                border border-white/10
                p-4
                hover:bg-white/10
                hover:border-white/20
                transition-colors duration-200
                flex flex-col gap-2
              "
              style={{
                /* Staggered entrance: each card 150 ms after the previous (Req 5.4) */
                animationDelay: `${index * 150}ms`,
              }}
              aria-label={`${perspective.countryName} perspective`}
            >
              {/* ── Flag + country name row ── */}
              <div className="flex items-center gap-2">
                {/* Flag emoji with text alternative (Req 5.3, 10.5) */}
                <span
                  role="img"
                  aria-label={flagLabel}
                  className="text-2xl leading-none flex-shrink-0"
                >
                  {flagEmoji || '🏳'}
                </span>

                {/* Country / region name (Req 5.2) */}
                <h3 className="text-sm font-semibold text-white/90 leading-snug">
                  {perspective.countryName}
                </h3>
              </div>

              {/* ── Summary (Req 5.2, 5.5 — ≤ 60 words enforced by Analyzer) ── */}
              <p className="text-sm text-white/60 leading-relaxed">
                {perspective.summary}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default GlobalPerspectivesPanel;
