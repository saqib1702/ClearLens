export interface MissingFact {
  heading: string;
  description: string;
}

export interface CountryPerspective {
  countryCode: string;
  countryName: string;
  summary: string;
}

export interface KeyPlayer {
  name: string;
  role: string;
}

export interface ConflictBackground {
  historicalSummary: string;
  keyPlayers: KeyPlayer[];
}

export interface AlternativeScenario {
  description: string;
}

export interface AIPrediction {
  primaryOutcome: string;
  confidencePercent: number;
  alternativeScenarios: AlternativeScenario[];
  disclaimer: string;
}

export interface AnalysisResult {
  biasScore: number;
  biasRationale: string;
  missingFacts: MissingFact[];
  countryPerspectives: CountryPerspective[];
  conflictBackground: ConflictBackground;
  aiPrediction: AIPrediction;
}

export type AppStatus = 'idle' | 'loading' | 'success' | 'error';

export interface AppState {
  status: AppStatus;
  inputValue: string;
  result: AnalysisResult | null;
  errorMessage: string | null;
}
