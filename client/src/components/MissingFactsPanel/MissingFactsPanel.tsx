// ─── Types ────────────────────────────────────────────────────────────────────

export interface MissingFact {
  heading: string;       // ≤ 10 words
  description: string;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface MissingFactsPanelProps {
  /** Array of missing facts identified by the Analyzer (3–7 items, or empty) */
  missingFacts: MissingFact[];
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * MissingFactsPanel
 *
 * Renders a list of key facts absent from the submitted content (Req 4.2).
 * Each item is labelled with a short heading (Req 4.3) and a description.
 *
 * Entrance animation (Req 4.4):
 *   Each list item fades in and slides up with a staggered delay of 100 ms
 *   per item, driven by an inline `animationDelay` style and the
 *   `missing-fact-item` CSS animation defined below via a <style> tag.
 *
 * Empty state (Req 4.5):
 *   When `missingFacts` is empty, a "content appears comprehensive" message
 *   is displayed instead of the list.
 *
 * Glassmorphism styling matches the rest of the ClearLens UI (Req 8.2, 8.3).
 * Accessible list semantics and ARIA labels satisfy Req 10.1, 10.2.
 */
export function MissingFactsPanel({ missingFacts }: MissingFactsPanelProps) {
  const isEmpty = missingFacts.length === 0;

  return (
    <>
      {/* ── Keyframe animation injected once per render tree ── */}
      <style>{`
        @keyframes missingFactEnter {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .missing-fact-item {
          animation: missingFactEnter 350ms ease-out both;
        }
      `}</style>

      <section
        className="
          rounded-2xl
          bg-white/5
          backdrop-blur-md
          border border-white/15
          p-5
        "
        aria-label="Key missing facts"
      >
        {/* ── Section header ── */}
        <h2 className="text-sm font-semibold text-white/80 uppercase tracking-wide mb-4">
          Key Missing Facts
        </h2>

        {isEmpty ? (
          /* ── Empty state (Req 4.5) ── */
          <p
            className="text-sm text-white/60 italic"
            role="status"
            aria-live="polite"
          >
            Content appears comprehensive — no significant facts appear to be
            missing.
          </p>
        ) : (
          /* ── Fact list (Req 4.2, 4.3, 4.4) ── */
          <ol
            className="space-y-4 list-none p-0 m-0"
            aria-label={`${missingFacts.length} missing fact${missingFacts.length !== 1 ? 's' : ''} identified`}
          >
            {missingFacts.map((fact, index) => (
              <li
                key={index}
                className="
                  missing-fact-item
                  flex gap-3
                  rounded-xl
                  bg-white/5
                  border border-white/10
                  p-4
                  hover:bg-white/10
                  hover:border-white/20
                  transition-colors duration-200
                "
                style={{
                  /* Staggered entrance: each item 100 ms after the previous (Req 4.4) */
                  animationDelay: `${index * 100}ms`,
                }}
              >
                {/* ── Index badge ── */}
                <span
                  className="
                    flex-shrink-0
                    w-6 h-6
                    rounded-full
                    bg-amber-500/20
                    text-amber-300
                    text-xs font-bold
                    flex items-center justify-center
                    mt-0.5
                  "
                  aria-hidden="true"
                >
                  {index + 1}
                </span>

                {/* ── Fact content ── */}
                <div className="flex-1 min-w-0">
                  {/* Heading (Req 4.3 — ≤ 10 words, enforced by Analyzer) */}
                  <h3 className="text-sm font-semibold text-white/90 leading-snug mb-1">
                    {fact.heading}
                  </h3>
                  {/* Description */}
                  <p className="text-sm text-white/60 leading-relaxed">
                    {fact.description}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>
    </>
  );
}

export default MissingFactsPanel;
