import { useState } from 'react';
import { BACKEND_CONFIG } from '../config';

export default function ExtensionSection({ isActive }) {
  const [showInstructions, setShowInstructions] = useState(false);

  if (!isActive) return null;

  return (
    <section id="extension" className="section section--active">
      <div className="container">
        <h2 className="section__title">CyberSpace Browser Extension</h2>
        <p className="subtitle">Protect yourself while browsing with our powerful security extension</p>

        <div className="grid">
          <div className="panel">
            <div className="card">
              <h3 className="card__title">
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Download Extension
              </h3>
              <p className="muted">Get the CyberSpace extension for real-time website protection</p>
              
              {!showInstructions ? (
                <button 
                  className="btn btn--primary" 
                  style={{ marginTop: '10px' }}
                  onClick={() => setShowInstructions(true)}
                >
                  Download Extension
                </button>
              ) : (
                <a 
                  href="/extension.crx" 
                  className="btn btn--primary" 
                  style={{ display: 'inline-block', marginTop: '10px', textDecoration: 'none' }}
                  target="_blank" 
                  rel="noreferrer"
                >
                  Download Extension ZIP
                </a>
              )}

              {showInstructions && (
                <div className="download-instructions">
                  <h4>Installation Steps:</h4>
                  <ol>
                    <li>Download the extension files</li>
                    <li>Open Chrome and go to <code>chrome://extensions/</code></li>
                    <li>Enable "Developer mode" (toggle in top right)</li>
                    <li>Click "Load unpacked" and select the extracted folder</li>
                    <li>Production API is pre-configured</li>
                    <li>No configuration needed - ready to use!</li>
                  </ol>
                </div>
              )}
            </div>

            <div className="card">
              <h3 className="card__title">
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                Extension Features
              </h3>
              <ul className="feature-list">
                {[
                  'Real-time website safety checking',
                  'Automatic threat detection',
                  'One-click security analysis',
                  'Badge indicators for safety status',
                  'Seamless integration with your backend'
                ].map((feature, i) => (
                  <li key={i}>
                    <svg className="feature-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
