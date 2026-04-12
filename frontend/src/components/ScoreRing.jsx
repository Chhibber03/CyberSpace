export default function ScoreRing({ score }) {
  // Map [-100..100] to [0..1]
  const pct = (score + 100) / 200;
  const length = 2 * Math.PI * 52; // circumference
  const offset = length * (1 - pct);

  return (
    <div className="score">
      <div className="score__ring">
        <svg viewBox="0 0 120 120" className="ring" aria-label="Cyber Safety Score">
          <defs>
            <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3B82F6" />
              <stop offset="50%" stopColor="#6366F1" />
              <stop offset="100%" stopColor="#22C55E" />
            </linearGradient>
          </defs>
          <circle className="ring__bg" cx="60" cy="60" r="52" />
          <circle
            className="ring__progress"
            cx="60" cy="60" r="52"
            style={{
              transition: 'stroke-dashoffset 650ms cubic-bezier(.22,1,.36,1)',
              strokeDashoffset: offset
            }}
          />
        </svg>
        <div className="score__value">
          <div id="scoreValue">{score}</div>
          <div className="score__label">Cyber Safety Score</div>
        </div>
      </div>
      <p className="muted">Safe sites: +1 • Breach or malicious: -10</p>
    </div>
  );
}
