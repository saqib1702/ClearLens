interface ErrorMessageProps {
  message: string | null;
}

export function ErrorMessage({ message }: ErrorMessageProps) {
  if (!message) return null;

  return (
    <div className="error-message" role="alert" aria-live="assertive">
      <p className="error-message__text">{message}</p>
    </div>
  );
}

export default ErrorMessage;
