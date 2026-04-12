import { useState, useEffect } from 'react';
import ResultCard from './ResultCard';

export default function HomeSection({ 
  isActive, 
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
          <p className="subtitle">Scan links and check email breaches to stay protected.</p>

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

        <div className="panel panel--centered">
          <div className="brand-display">
            <div className="brand-display__logo">
              <svg width="212" height="43" viewBox="0 0 212 43" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M155.1 4.4L164.4 40.3L155.7 34.3L155.1 33.9L154.5 34.3L145.8 40.3L155.1 4.4ZM155.1 0L144 43L155.1 35.3L166.2 43L155.1 0Z" fill="currentColor"/>
                <path d="M158.9 27.6C158.2 26.7 156.1 23.5 156.1 23.4L155.1 15.5L154.1 23.4C154 23.5 152 26.7 151.3 27.6C151.1 27.9 151 28.1 151 28.3C151 28.7 151 29.1 151 29.5C154.4 28.4 151 29.5 154.4 28.4L155.2 32L156 28.4C159.4 29.5 156 28.4 159.4 29.5C159.4 29.1 159.4 28.7 159.4 28.3C159.2 28 159.2 27.8 158.9 27.6Z" fill="currentColor"/>
                <path d="M0 30.6V25.4C0 23.6 1.5 22.1 3.3 22.1H13.3L12.9 23.6H3.2C2.2 23.6 1.4 24.4 1.4 25.5V30.7C1.4 31.7 2.2 32.6 3.3 32.6H14.8L14.4 34.1H3.4C1.5 34 0 32.5 0 30.6Z" fill="currentColor"/>
                <path d="M23.7 22.1H25.7L31.1 28.8H31.2L36.6 22.1H38.6L31.9 30.3V34H30.4V30.3L23.7 22.1Z" fill="currentColor"/>
                <path d="M48.8 22.1H58.5C59.9 22.1 61.1 23.3 61.1 24.7C61.1 25.1 61 25.5 60.8 25.9C62.4 26.1 63.7 27.5 63.7 29.2V30.7C63.7 32.6 62.2 34 60.4 34H48.9V25.8H58.6C59.2 25.8 59.7 25.3 59.7 24.7C59.7 24.1 59.2 23.6 58.6 23.6H48.9V22.1H48.8ZM50.3 27.3V32.5H60.3C61.3 32.5 62.2 31.7 62.2 30.6V29.1C62.2 28.1 61.4 27.2 60.3 27.2H50.3V27.3Z" fill="currentColor"/>
                <path d="M84.7 22.1C87 22.1 88.8 23.9 88.8 26.2C88.8 28.5 87 30.3 84.7 30.3H83.6L88.8 34H86.3L81.1 30.3H75.4V34H73.9V28.8H84.7C86.1 28.8 87.3 27.6 87.3 26.2C87.3 24.8 86.1 23.6 84.7 23.6H73.9V22.1H84.7Z" fill="currentColor"/>
                <path d="M99.3 25.4C99.3 23.5 100.8 22.1 102.6 22.1H112.6L112.2 23.6H102.7C101.7 23.6 100.8 24.4 100.8 25.5C100.8 26.5 101.7 27.4 102.7 27.4H110.9C112.8 27.4 114.2 28.9 114.2 30.7C114.2 32.6 112.7 34 110.9 34H100.9L101.3 32.5H111C112 32.5 112.9 31.7 112.9 30.6C112.9 29.5 112.1 28.7 111 28.7H102.7C100.8 28.8 99.3 27.3 99.3 25.4Z" fill="currentColor"/>
                <path d="M125.3 28.8H136.8C137.8 28.8 138.7 28 138.7 26.9V25.4C138.7 24.4 137.9 23.5 136.8 23.5H125.3V22H136.8C138.7 22 140.1 23.5 140.1 25.3V26.8C140.1 28.6 138.6 30.1 136.8 30.1H126.8V33.8H125.3V28.8Z" fill="currentColor"/>
                <path d="M171.8 30.6V25.4C171.8 23.6 173.3 22.1 175.1 22.1H185.1L184.7 23.6H175C174 23.6 173.2 24.4 173.2 25.5V30.7C173.2 31.7 174 32.6 175.1 32.6H186.6L186.2 34.1H175C173.2 34 171.8 32.5 171.8 30.6Z" fill="currentColor"/>
                <path d="M211.7 22.1L211.3 23.6H196.8V22.1H211.7ZM196.9 34V27.3H208.8L208.4 28.8H198.4V32.5H211.7L211.3 34H196.9Z" fill="currentColor"/>
              </svg>
            </div>
          </div>
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
