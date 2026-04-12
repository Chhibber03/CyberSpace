export default function AboutSection({ isActive }) {
  if (!isActive) return null;
  return (
    <section id="about" className="section section--active">
      <div className="container">
        <h2 className="section__title">About</h2>
        <p className="muted">This is a demo. Real checks will connect to a backend later.</p>
      </div>
    </section>
  );
}
