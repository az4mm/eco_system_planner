// Dashboard Page — main recommendation interface
import { useState, useEffect } from 'react';
import { bundleService } from '../services/bundleService';
import BundleCard from '../components/BundleCard';
import CompareModal from '../components/CompareModal';
import toast from 'react-hot-toast';
import { HiOutlineLightningBolt } from 'react-icons/hi';
import './DashboardPage.css';

const ECOSYSTEMS = ['Apple', 'Android', 'Windows', 'Linux', 'Mixed'];
const USAGE_PROFILES = ['Gaming', 'Creator', 'Office', 'Student', 'Photography', 'Travel'];

const ECOSYSTEM_ICONS = { Apple: '🍎', Android: '🤖', Windows: '🪟', Linux: '🐧', Mixed: '🔀' };
const USAGE_ICONS = { Gaming: '🎮', Creator: '🎨', Office: '💼', Student: '📚', Photography: '📷', Travel: '✈️' };

// Persist dashboard state so it survives navigation to Compare/Saved and back
const STORAGE_KEY = 'dashboard_state';

function loadSavedState() {
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch { return null; }
}

function saveState(state) {
  try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
}

export default function DashboardPage() {
  const saved = loadSavedState();
  const [budget, setBudget] = useState(saved?.budget || 25000);
  const [ecosystem, setEcosystem] = useState(saved?.ecosystem || '');
  const [usageProfile, setUsageProfile] = useState(saved?.usageProfile || '');
  const [bundles, setBundles] = useState(saved?.bundles || []);
  const [loading, setLoading] = useState(false);
  const [compareList, setCompareList] = useState(saved?.compareList || []);
  const [showCompare, setShowCompare] = useState(false);

  // Persist state whenever it changes
  useEffect(() => {
    saveState({ budget, ecosystem, usageProfile, bundles, compareList });
  }, [budget, ecosystem, usageProfile, bundles, compareList]);

  const handleGenerate = async () => {
    if (!ecosystem) { toast.error('Please select an ecosystem'); return; }
    if (!usageProfile) { toast.error('Please select a usage profile'); return; }
    if (budget < 5000) { toast.error('Minimum budget is ₹5,000'); return; }

    setLoading(true);
    setCompareList([]);
    try {
      const results = await bundleService.generateBundles(budget, ecosystem, usageProfile);
      setBundles(results);
      toast.success(`Generated ${results.length} bundles!`);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to generate bundles');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (bundleId) => {
    try {
      await bundleService.saveBundle(bundleId);
      toast.success('Bundle saved!');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to save');
    }
  };

  const handleCompare = (bundleId) => {
    setCompareList((prev) => {
      if (prev.includes(bundleId)) return prev.filter((id) => id !== bundleId);
      if (prev.length >= 3) { toast.error('Max 3 bundles to compare'); return prev; }
      return [...prev, bundleId];
    });
  };

  const goToCompare = () => {
    if (compareList.length < 2) { toast.error('Select at least 2 bundles'); return; }
    setShowCompare(true);
  };

  const formatBudget = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="page">
      <div className="container">
        <div className="page-header animate-in">
          <h1>🚀 Build Your Ecosystem</h1>
          <p>Set your budget, choose your ecosystem and usage — we'll find the best bundles for you.</p>
        </div>

        <div className="dashboard-inputs glass-card animate-in" style={{ animationDelay: '0.1s' }}>
          <div className="input-section">
            <label className="form-label">Budget: {formatBudget(budget)}</label>
            <input type="range" className="budget-slider" min={5000} max={300000} step={1000} value={budget} onChange={(e) => setBudget(Number(e.target.value))} />
            <div className="budget-range">
              <span>₹5,000</span>
              <input type="number" className="budget-input form-input" min={5000} max={500000} value={budget} onChange={(e) => setBudget(Number(e.target.value))} />
              <span>₹3,00,000</span>
            </div>
          </div>

          <div className="input-section">
            <label className="form-label">Ecosystem</label>
            <div className="chip-grid">
              {ECOSYSTEMS.map((eco) => (
                <button key={eco} className={`chip ${ecosystem === eco ? 'chip-active' : ''}`} onClick={() => setEcosystem(eco)}>
                  {ECOSYSTEM_ICONS[eco]} {eco}
                </button>
              ))}
            </div>
          </div>

          <div className="input-section">
            <label className="form-label">Usage Profile</label>
            <div className="chip-grid">
              {USAGE_PROFILES.map((profile) => (
                <button key={profile} className={`chip ${usageProfile === profile ? 'chip-active' : ''}`} onClick={() => setUsageProfile(profile)}>
                  {USAGE_ICONS[profile]} {profile}
                </button>
              ))}
            </div>
          </div>

          <button onClick={handleGenerate} className="btn btn-primary btn-lg generate-btn" disabled={loading}>
            <HiOutlineLightningBolt />
            {loading ? 'Generating...' : 'Generate Bundles'}
          </button>
        </div>

        {bundles.length > 0 && (
          <div className="results-section animate-in" style={{ animationDelay: '0.2s' }}>
            <div className="results-header">
              <h2>Top {bundles.length} Bundles</h2>
              {compareList.length >= 2 && (
                <button onClick={goToCompare} className="btn btn-secondary">
                  Compare ({compareList.length})
                </button>
              )}
            </div>
            <div className="bundles-grid">
              {bundles.map((bundle, i) => (
                <BundleCard key={bundle.id} bundle={bundle} rank={i + 1} onSave={handleSave} onCompare={handleCompare} isComparing={compareList.includes(bundle.id)} />
              ))}
            </div>
          </div>
        )}

        {showCompare && (
          <CompareModal
            bundles={bundles.filter((b) => compareList.includes(b.id))}
            onClose={() => setShowCompare(false)}
          />
        )}
      </div>
    </div>
  );
}
