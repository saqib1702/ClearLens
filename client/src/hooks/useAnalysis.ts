import { useState, useCallback } from 'react';
import type { AnalysisResult, AppStatus } from '../types/analysis';

export interface UseAnalysisReturn {
  status: AppStatus;
  inputValue: string;
  result: AnalysisResult | null;
  errorMessage: string | null;
  setInputValue: (value: string) => void;
  analyze: () => Promise<void>;
  reset: () => void;
}

export function useAnalysis(): UseAnalysisReturn {
  const [status, setStatus] = useState<AppStatus>('idle');
  const [inputValue, setInputValue] = useState('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const analyze = useCallback(async () => {
    setStatus('loading');
    setErrorMessage(null);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: inputValue }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      setResult(data.data);
      setStatus('success');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'An unexpected error occurred');
      setStatus('error');
    }
  }, [inputValue]);

  const reset = useCallback(() => {
    setStatus('idle');
    setInputValue('');
    setResult(null);
    setErrorMessage(null);
  }, []);

  return {
    status,
    inputValue,
    result,
    errorMessage,
    setInputValue,
    analyze,
    reset,
  };
}
