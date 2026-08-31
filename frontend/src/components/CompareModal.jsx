// CompareModal — side-by-side comparison as an overlay dialog
import { HiOutlineX } from 'react-icons/hi';
import './CompareModal.css';

export default function CompareModal({ bundles, onClose }) {
  if (!bundles || bundles.length < 2) return null;

  const formatPrice = (price) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price);

  const getScoreClass = (score) => {
    if (score >= 80) return 'score-high';
    if (score >= 60) return 'score-medium';
    return 'score-low';
  };

  const categories = ['Laptop', 'Smartphone', 'Earbuds', 'Smartwatch', 'Accessories'];

  // Find the best score to highlight the winner
  const bestOverall = Math.max(...bundles.map((b) => b.overall_score));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-card animate-in" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>⚖️ Compare Bundles</h2>
          <button className="modal-close" onClick={onClose}>
            <HiOutlineX />
          </button>
        </div>

        <div className="modal-body">
          <table className="compare-table">
            <thead>
              <tr>
                <th className="compare-label-col">Metric</th>
                {bundles.map((b, i) => (
                  <th key={b.id || i} className={`compare-bundle-col ${b.overall_score === bestOverall ? 'winner-col' : ''}`}>
                    <span className="bundle-label">Bundle {String.fromCharCode(65 + i)}</span>
                    {b.overall_score === bestOverall && <span className="winner-badge">👑 Best</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="row-label">Overall Score</td>
                {bundles.map((b, i) => (
                  <td key={b.id || i}>
                    <span className={`score-badge ${getScoreClass(b.overall_score)}`}>{b.overall_score.toFixed(1)}</span>
                  </td>
                ))}
              </tr>
              <tr>
                <td className="row-label">Compatibility</td>
                {bundles.map((b, i) => (
                  <td key={b.id || i}>{b.compatibility_score.toFixed(1)}</td>
                ))}
              </tr>
              <tr>
                <td className="row-label">Value Score</td>
                {bundles.map((b, i) => (
                  <td key={b.id || i}>{b.value_score.toFixed(1)}</td>
                ))}
              </tr>
              <tr>
                <td className="row-label">Total Price</td>
                {bundles.map((b, i) => (
                  <td key={b.id || i} className="price-tag">{formatPrice(b.total_price)}</td>
                ))}
              </tr>
              <tr className="divider-row">
                <td colSpan={bundles.length + 1}>Products</td>
              </tr>
              {categories.map((cat) => (
                <tr key={cat}>
                  <td className="row-label">{cat}</td>
                  {bundles.map((b, i) => {
                    const item = b.items?.find((it) => it.category === cat);
                    return (
                      <td key={b.id || i}>
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
      </div>
    </div>
  );
}
