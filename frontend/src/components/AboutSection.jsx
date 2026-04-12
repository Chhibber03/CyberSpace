export default function AboutSection({ isActive }) {
  if (!isActive) return null;
  return (
    <section id="about" className="section section--active">
      <div className="container">
        <div className="panel" style={{ padding: '40px' }}>
          <h2 className="section__title" style={{ fontSize: '36px', marginBottom: '16px' }}>About CyberSpace</h2>
          <p className="subtitle" style={{ fontSize: '18px', maxWidth: '800px', marginBottom: '32px' }}>
            CyberSpace is your unified platform for actionable cyber threat intelligence, digital footprint monitoring, and communication safety. We bring enterprise-grade security to your personal space.
          </p>
          
          <div className="grid grid--2col">
            <div className="card">
              <h3 className="card__title">Real-Time Threat Detection</h3>
              <p className="muted">
                Our technology utilizes top-tier heuristic algorithms paired with leading security databases. Every time you scan a URL, it is instantly checked for phishing signatures, obscure domain tricks, and malicious payloads.
              </p>
            </div>
            <div className="card">
              <h3 className="card__title">Data Breach Monitoring</h3>
              <p className="muted">
                Your personal and corporate emails shouldn't be a vector for attack. Check whether your data has been leaked across billions of known compromised records, to stay one step ahead of attackers.
              </p>
            </div>
            <div className="card">
              <h3 className="card__title">Browser Extension</h3>
              <p className="muted">
                Privacy matters. Our browser extension operates seamlessly in the background, intercepting suspicious domains exactly when you click them, providing proactive, ambient defense that never sleeps.
              </p>
            </div>
            <div className="card">
              <h3 className="card__title">Our Security Philosophy</h3>
              <p className="muted">
                Security is more than just closing doors; it's understanding the landscape. Our platform ensures users not only stay protected but also learn about risk patterns, elevating their overall security awareness.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
