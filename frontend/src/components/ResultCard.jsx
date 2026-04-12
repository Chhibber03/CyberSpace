export default function ResultCard({ kind, title, message, status, url, email }) {
  const isSafe = status === 'safe';
  const icon = isSafe ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      <polyline points="9 12 12 15 16 9"/>
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  );

  const klass = isSafe ? 'badge badge--success' : 'badge badge--danger';
  const cardKlass = isSafe ? 'card--safe' : 'card--danger';

  return (
    <div className={`result-card ${cardKlass}`}>
      <div className="result-card__left">
        <span className={klass}>
          {icon} {title}
        </span>
        {kind === 'url' ? (
          <div className="url">{url}</div>
        ) : (
          <div>{email}</div>
        )}
      </div>
      <div className="muted">{message}</div>
    </div>
  );
}
