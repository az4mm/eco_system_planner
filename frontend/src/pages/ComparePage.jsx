// Compare Page — side-by-side bundle comparison
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { bundleService } from '../services/bundleService';
import toast from 'react-hot-toast';
import './ComparePage.css';

export default function ComparePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [bundles, setBundles] = useState([]);
  const [loading, setLoading] = useState(true);

  const bundleIds = location.state?.bundleIds || [];

  useEffect(() => {
    if (bundleIds.length < 2) {
      toast.error('Select at least 2 bundles from Dashboard');
      navigate('/dashboard');
      return;
    }
    loadBundles();
  }, []);

  const loadBundles = async () => {
    try {
      const data = await bundleService.compareBundles(bundleIds);
      setBundles(data);
    } catch (err) {
      toast.error('Failed to load bundles');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price);

  const getScoreClass = (score) => {
    if (score >= 80) return 'score-high';
    if (score >= 60) return 'score-medium';
    return 'score-low';
  };

  if (loading) {
    return (
      <div className="page"><div className="container">
        <div className="loading-state">Loading comparison...</div>
      </div></div>
    );
  }

  const categories = ['Laptop', 'Smartphone', 'Earbuds', 'Smartwatch', 'Accessories'];

  return (
    <div className="page">
      <div className="container">
        <div className="page-header animate-in">
          <h1>⚖️ Compare Bundles</h1>
          <p>Side-by-side comparison of your selected bundles</p>
        </div>

        <div className="compare-table-wrapper animate-in" style={{ animationDelay: '0.1s' }}>
          <table className="compare-table">
            <thead>
              <tr>
                <th className="compare-label-col">Metric</th>
                {bundles.map((b, i) => (
                  <th key={b.id} className="compare-bundle-col">
                    Bundle {String.fromCharCode(65 + i)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="row-label">Overall Score</td>
                {bundles.map((b) => (
                  <td key={b.id}><span className={`score-badge ${getScoreClass(b.overall_score)}`}>{b.overall_score.toFixed(1)}</span></td>
                ))}
              </tr>
              <tr>
                <td className="row-label">Compatibility</td>
                {bundles.map((b) => (
                  <td key={b.id}>{b.compatibility_score.toFixed(1)}</td>
                ))}
              </tr>
              <tr>
                <td className="row-label">Value Score</td>
                {bundles.map((b) => (
                  <td key={b.id}>{b.value_score.toFixed(1)}</td>
                ))}
              </tr>
              <tr>
                <td className="row-label">Total Price</td>
                {bundles.map((b) => (
                  <td key={b.id} className="price-tag">{formatPrice(b.total_price)}</td>
                ))}
              </tr>
              <tr className="divider-row"><td colSpan={bundles.length + 1}>Products</td></tr>
              {categories.map((cat) => (
                <tr key={cat}>
                  <td className="row-label">{cat}</td>
                  {bundles.map((b) => {
                    const item = b.items?.find((it) => it.category === cat);
                    return (
                      <td key={b.id}>
                        {item ? (
                          <div className="compare-product">
                            <span className="cp-name">{item.product.brand} {item.product.model}</span>
                            <span className="cp-price">{formatPrice(item.product.price)}</span>
                          </div>
                        ) : '—'}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="compare-actions">
          <button onClick={() => navigate('/dashboard')} className="btn btn-secondary">← Back to Dashboard</button>
        </div>
      </div>
    </div>
  );
}
