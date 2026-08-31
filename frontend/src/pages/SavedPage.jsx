// Saved Bundles Page
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { bundleService } from '../services/bundleService';
import BundleCard from '../components/BundleCard';
import toast from 'react-hot-toast';
import { HiOutlineBookmark } from 'react-icons/hi';
import './SavedPage.css';

export default function SavedPage() {
  const [saved, setSaved] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => { loadSaved(); }, []);

  const loadSaved = async () => {
    try {
      const data = await bundleService.getSavedBundles();
      setSaved(data);
    } catch (err) {
      toast.error('Failed to load saved bundles');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (savedId) => {
    try {
      await bundleService.deleteSavedBundle(savedId);
      setSaved((prev) => prev.filter((s) => s.id !== savedId));
      toast.success('Removed from saved');
    } catch (err) {
      toast.error('Failed to remove');
    }
  };

  return (
    <div className="page">
      <div className="container">
        <div className="page-header animate-in">
          <h1><HiOutlineBookmark /> Saved Bundles</h1>
          <p>Your bookmarked technology bundles</p>
        </div>

        {loading ? (
          <div className="loading-state">Loading saved bundles...</div>
        ) : saved.length === 0 ? (
          <div className="empty-state glass-card animate-in">
            <span className="empty-icon">📭</span>
            <h3>No saved bundles yet</h3>
            <p>Generate bundles from the Dashboard and save your favorites.</p>
            <button onClick={() => navigate('/dashboard')} className="btn btn-primary">Go to Dashboard</button>
          </div>
        ) : (
          <div className="saved-grid">
            {saved.map((item, i) => (
              <div key={item.id} className="saved-item animate-in" style={{ animationDelay: `${i * 0.1}s` }}>
                <BundleCard bundle={item.bundle} rank={i + 1} />
                <button onClick={() => handleDelete(item.id)} className="btn btn-sm btn-outline remove-btn">
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
