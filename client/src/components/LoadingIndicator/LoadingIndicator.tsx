interface LoadingIndicatorProps {
  visible: boolean;
}

export function LoadingIndicator({ visible }: LoadingIndicatorProps) {
  if (!visible) return null;

  return (
    <div className="loading-indicator" role="status" aria-live="polite">
      <div className="loading-indicator__spinner" aria-hidden="true" />
      <span className="loading-indicator__text">Analyzing content...</span>
    </div>
  );
}

export default LoadingIndicator;
