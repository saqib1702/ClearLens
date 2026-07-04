interface InputPanelProps {
  inputValue: string;
  onInputChange: (value: string) => void;
  onSubmit: () => void;
  onReset: () => void;
  isLoading: boolean;
  validationError?: string | null;
}

export function InputPanel({
  inputValue,
  onInputChange,
  onSubmit,
  onReset,
  isLoading,
  validationError,
}: InputPanelProps) {
  return (
    <section className="input-panel" aria-label="Analysis input">
      <textarea
        value={inputValue}
        onChange={(e) => onInputChange(e.target.value)}
        placeholder="Paste a news article or describe a topic to analyze..."
        maxLength={10000}
        disabled={isLoading}
        aria-label="News article or topic input"
        className="input-panel__textarea"
      />
      {validationError && (
        <p className="input-panel__error" role="alert">
          {validationError}
        </p>
      )}
      <div className="input-panel__controls">
        <button
          onClick={onSubmit}
          disabled={isLoading}
          aria-label="Analyze content"
          className="input-panel__submit"
        >
          {isLoading ? 'Analyzing...' : 'Analyze'}
        </button>
        <button
          onClick={onReset}
          disabled={isLoading}
          aria-label="Reset analysis"
          className="input-panel__reset"
        >
          Reset
        </button>
      </div>
    </section>
  );
}

export default InputPanel;
