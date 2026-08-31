// Landing Page — hero section with feature cards
import { Link } from 'react-router-dom';
import { HiOutlineLightningBolt, HiOutlineCurrencyRupee, HiOutlineShieldCheck, HiOutlineChartBar } from 'react-icons/hi';
import './LandingPage.css';

export default function LandingPage() {
  return (
    <div className="landing">
      <section className="hero">
        <div className="container">
          <div className="hero-content animate-in">
            <span className="hero-badge">⚡ AI-Powered Tech Recommendations</span>
            <h1>Build Your Perfect<br /><span className="gradient-text">Tech Ecosystem</span></h1>
            <p className="hero-subtitle">
              Enter your budget, choose your ecosystem, and get complete technology bundles —
              laptop, phone, earbuds, watch & accessories — optimized for compatibility and value.
            </p>
            <div className="hero-actions">
              <Link to="/register" className="btn btn-primary btn-lg">Get Started Free</Link>
              <Link to="/login" className="btn btn-secondary btn-lg">Login</Link>
            </div>
            <div className="hero-stats">
              <div className="stat"><span className="stat-number">100+</span><span className="stat-label">Products</span></div>
              <div className="stat"><span className="stat-number">5</span><span className="stat-label">Ecosystems</span></div>
              <div className="stat"><span className="stat-number">6</span><span className="stat-label">Usage Profiles</span></div>
            </div>
          </div>
        </div>
      </section>

      <section className="features">
        <div className="container">
          <h2 className="section-title">How It Works</h2>
          <div className="features-grid">
            {[
              { icon: <HiOutlineCurrencyRupee />, title: 'Set Your Budget', desc: 'Enter any budget from ₹5,000 to ₹5,00,000 and we optimize within your limits.' },
              { icon: <HiOutlineShieldCheck />, title: 'Choose Ecosystem', desc: 'Apple, Android, Windows, Linux, or Mixed — we ensure all devices work together.' },
              { icon: <HiOutlineLightningBolt />, title: 'Get Recommendations', desc: 'Our engine generates 5 ranked bundles scored on compatibility, value, and ratings.' },
              { icon: <HiOutlineChartBar />, title: 'Compare & Export', desc: 'Compare bundles side-by-side, save favourites, and export detailed PDF reports.' },
            ].map((feature, i) => (
              <div key={i} className="feature-card glass-card animate-in" style={{ animationDelay: `${i * 0.15}s` }}>
                <div className="feature-icon">{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
