// BundleCard component — displays a single bundle recommendation
import { HiOutlineStar, HiOutlineBookmark, HiOutlineScale, HiOutlineDownload } from 'react-icons/hi';
import './BundleCard.css';

export default function BundleCard({ bundle, rank, onSave, onCompare, onExport, isComparing = false }) {
  const getScoreClass = (score) => {
    if (score >= 80) return 'score-high';
    if (score >= 60) return 'score-medium';
    return 'score-low';
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price);
  };

  return (
    <div className={`bundle-card glass-card animate-in ${isComparing ? 'card-comparing' : ''}`} style={{ animationDelay: `${rank * 0.1}s` }}>
      <div className="bundle-header">
        <div className="bundle-rank">
          {rank === 1 && <span className="rank-badge gold">🥇</span>}
          {rank === 2 && <span className="rank-badge silver">🥈</span>}
          {rank === 3 && <span className="rank-badge bronze">🥉</span>}
          {rank > 3 && <span className="rank-badge">#{rank}</span>}
          <span>Bundle {String.fromCharCode(64 + rank)}</span>
        </div>
        <div className={`score-badge ${getScoreClass(bundle.overall_score)}`}>
          <HiOutlineStar /> {bundle.overall_score.toFixed(1)}
        </div>
      </div>

      <div className="score-breakdown">
        <div className="score-item">
          <span className="score-label">Compatibility</span>
          <div className="score-bar">
            <div className="score-fill" style={{ width: `${bundle.compatibility_score}%`, background: 'var(--accent-cyan)' }}></div>
          </div>
          <span className="score-value">{bundle.compatibility_score.toFixed(0)}</span>
        </div>
        <div className="score-item">
          <span className="score-label">Value</span>
          <div className="score-bar">
            <div className="score-fill" style={{ width: `${bundle.value_score}%`, background: 'var(--accent-green)' }}></div>
          </div>
          <span className="score-value">{bundle.value_score.toFixed(0)}</span>
        </div>
      </div>

      <div className="bundle-products">
        {bundle.items?.map((item) => (
          <div key={item.id} className="product-row">
            <div className="product-info">
              <span className="product-category">{item.category}</span>
              <span className="product-name">{item.product.brand} {item.product.model}</span>
            </div>
            <span className="product-price">{formatPrice(item.product.price)}</span>
          </div>
        ))}
      </div>

      <div className="bundle-footer">
        <div className="bundle-total">
          <span>Total</span>
          <span className="price-tag">{formatPrice(bundle.total_price)}</span>
        </div>
        <div className="bundle-actions">
          {onCompare && (
            <button
              onClick={() => onCompare(bundle.id)}
              className={`btn btn-sm ${isComparing ? 'btn-compare-active' : 'btn-secondary'}`}
              title={isComparing ? 'Remove from compare' : 'Add to compare'}
            >
              <HiOutlineScale /> {isComparing && '✓'}
            </button>
          )}
          {onSave && (
            <button onClick={() => onSave(bundle.id)} className="btn btn-sm btn-secondary" title="Save">
              <HiOutlineBookmark />
            </button>
          )}
          {onExport && (
            <button onClick={() => onExport(bundle.id)} className="btn btn-sm btn-secondary" title="Export PDF">
              <HiOutlineDownload />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
