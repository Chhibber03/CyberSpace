export default function Footer({ onNavigate }) {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container footer__inner">
        <span>© {year} CyberSpace</span>
        <a 
          className="link" 
          href="#home"
          onClick={(e) => { e.preventDefault(); onNavigate('home'); window.scrollTo(0, 0); }}
        >
          Back to top ↑
        </a>
      </div>
    </footer>
  );
}
