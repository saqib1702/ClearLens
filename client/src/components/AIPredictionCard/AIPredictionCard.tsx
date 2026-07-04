import type { AIPrediction } from '../../types/analysis';

interface AIPredictionCardProps {
  prediction: AIPrediction;
}

export function AIPredictionCard({ prediction }: AIPredictionCardProps) {
  return (
    <section
      className="ai-prediction-card rounded-2xl bg-white/5 backdrop-blur-md border border-white/15 p-5"
      aria-label="AI prediction"
    >
      <h2 className="text-sm font-semibold text-white/80 uppercase tracking-wide mb-4">
        AI Prediction
      </h2>

      <p className="text-base font-medium text-white/90 mb-3">
        {prediction.primaryOutcome}
      </p>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-white/60">Confidence</span>
          <span className="text-sm font-semibold text-white/90">
            {prediction.confidencePercent}%
          </span>
        </div>
        <div
          className="h-2 rounded-full bg-white/10 overflow-hidden"
          role="progressbar"
          aria-valuenow={prediction.confidencePercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Confidence: ${prediction.confidencePercent}%`}
        >
          <div
            className="h-full rounded-full bg-emerald-400/70"
            style={{ width: `${prediction.confidencePercent}%` }}
          />
        </div>
      </div>

      <h3 className="text-xs font-semibold text-white/70 uppercase tracking-wide mb-2">
        Alternative Scenarios
      </h3>
      <ul className="space-y-2 mb-4" aria-label="Alternative scenarios">
        {prediction.alternativeScenarios.map((scenario, index) => (
          <li key={index} className="text-sm text-white/60 leading-relaxed">
            {scenario.description}
          </li>
        ))}
      </ul>

      <p className="text-xs text-white/40 italic" aria-label="Disclaimer">
        {prediction.disclaimer}
      </p>
    </section>
  );
}

export default AIPredictionCard;
