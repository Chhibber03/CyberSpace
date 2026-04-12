import { useEffect, useState } from 'react';

export default function Navbar({ activeSection, onNavigate }) {
  return (
    <header className="header">
      <div className="header__inner">
        <div className="brand" onClick={() => onNavigate('home')} style={{ cursor: 'pointer' }}>
          <div className="brand__logo">
            <svg viewBox="0 0 24 24" fill="none" stroke="url(#brandGrad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <defs><linearGradient id="brandGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#3B82F6"/><stop offset="100%" stopColor="#22C55E"/></linearGradient></defs>
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <div className="brand__text">CyberSpace</div>
        </div>
        <div className="nav-divider"></div>
        <nav className="nav">
          <a
            href="#home"
            className={`nav__link ${activeSection === 'home' ? 'active' : ''}`}
            onClick={(e) => { e.preventDefault(); onNavigate('home'); }}
          >
            Home
          </a>
          <a
            href="#dashboard"
            className={`nav__link ${activeSection === 'dashboard' ? 'active' : ''}`}
            onClick={(e) => { e.preventDefault(); onNavigate('dashboard'); }}
          >
            Dashboard
          </a>
          <a
            href="#extension"
            className={`nav__link ${activeSection === 'extension' ? 'active' : ''}`}
            onClick={(e) => { e.preventDefault(); onNavigate('extension'); }}
          >
            Extension
          </a>
          <a
            href="#about"
            className={`nav__link ${activeSection === 'about' ? 'active' : ''}`}
            onClick={(e) => { e.preventDefault(); onNavigate('about'); }}
          >
            About
          </a>
        </nav>
      </div>
    </header>
  );
}
