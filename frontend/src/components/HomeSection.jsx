import { useState, useEffect } from 'react';
import ScoreRing from './ScoreRing';
import ResultCard from './ResultCard';

export default function HomeSection({ 
  isActive, 
  score, 
  results, 
  onScanUrl, 
  onCheckEmail,
  isScanningUrl,
  isCheckingEmail,
  backendStatusText,
  backendStatusClass
}) {
  const [urlInput, setUrlInput] = useState('');
  const [emailInput, setEmailInput] = useState('');

  if (!isActive) return null;

  return (
    <section id="home" className="section section--active">
      <div className="container grid grid--2col">
        <div className="panel">
          <h1 className="title">CyberSpace – Stay Safe Online</h1>
          <p className="subtitle">Scan links, check email breaches, and grow your Cyber Safety Score.</p>

          <div className="card">
            <h2 className="card__title">
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              Scan a Link
            </h2>
            <form 
              className="form" 
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                onScanUrl(urlInput);
                setUrlInput('');
              }}
            >
              <div className="form__row">
                <input 
                  type="url" 
                  className="input" 
                  placeholder="https://example.com" 
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  disabled={isScanningUrl}
                  required 
                />
                <button type="submit" className="btn btn--primary" disabled={isScanningUrl || !urlInput.trim()}>
                  {isScanningUrl ? 'Scanning...' : 'Scan'}
                </button>
              </div>
            </form>
          </div>

          <div className="card">
            <h2 className="card__title">
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
              Check Email Breach
            </h2>
            <form 
              className="form" 
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                onCheckEmail(emailInput);
                setEmailInput('');
              }}
            >
              <div className="form__row">
                <input 
                  type="email" 
                  className="input" 
                  placeholder="you@example.com" 
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  disabled={isCheckingEmail}
                  required 
                />
                <button type="submit" className="btn btn--secondary" disabled={isCheckingEmail || !emailInput.trim()}>
                  {isCheckingEmail ? 'Checking...' : 'Check'}
                </button>
              </div>
              <div className="form__status">
                <span className={`status-dot ${backendStatusClass}`}></span>
                Backend: <span>{backendStatusText}</span>
              </div>
            </form>
          </div>
        </div>

        <div className="panel">
          <ScoreRing score={score} />
          <div className="results">
            {results.map((res, i) => (
              <ResultCard key={i} {...res} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
