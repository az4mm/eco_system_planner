// Products Page — browse the full product catalog with filters, search, and pagination
import { useState, useEffect, useCallback } from 'react';
import { productService } from '../services/productService';
import toast from 'react-hot-toast';
import { HiOutlineSearch, HiOutlineFilter, HiOutlineStar, HiOutlineChevronLeft, HiOutlineChevronRight } from 'react-icons/hi';
import './ProductsPage.css';

const CATEGORIES = ['All', 'Laptop', 'Smartphone', 'Earbuds', 'Smartwatch', 'Accessories'];
const ECOSYSTEMS = ['All', 'Apple', 'Android', 'Windows', 'Linux'];
const SORT_OPTIONS = [
  { value: 'price_asc', label: 'Price: Low → High' },
  { value: 'price_desc', label: 'Price: High → Low' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'name', label: 'Name A–Z' },
];
const PER_PAGE = 12;

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [ecosystem, setEcosystem] = useState('All');
  const [sortBy, setSortBy] = useState('price_asc');
  const [showFilters, setShowFilters] = useState(false);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await productService.getProducts({
        category: category !== 'All' ? category : undefined,
        ecosystem: ecosystem !== 'All' ? ecosystem : undefined,
        search: search || undefined,
        sortBy,
        page,
        perPage: PER_PAGE,
      });
      setProducts(data.products);
      setTotal(data.total);
      setTotalPages(data.total_pages);
    } catch (err) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [category, ecosystem, search, sortBy, page]);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [category, ecosystem, search, sortBy]);

  const formatPrice = (price) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    loadProducts();
  };

  return (
    <div className="page">
      <div className="container">
        <div className="page-header animate-in">
          <h1>📦 Product Catalog</h1>
          <p>Browse {total} products across all categories</p>
        </div>

        {/* Search + Filter Toggle */}
        <div className="catalog-toolbar glass-card animate-in" style={{ animationDelay: '0.1s' }}>
          <form onSubmit={handleSearch} className="search-bar">
            <HiOutlineSearch className="search-icon" />
            <input
              type="text"
              className="form-input search-input"
              placeholder="Search by brand or model..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </form>
          <button className="btn btn-sm btn-secondary filter-toggle" onClick={() => setShowFilters(!showFilters)}>
            <HiOutlineFilter /> Filters
          </button>
          <select className="form-select sort-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Filter Chips */}
        {showFilters && (
          <div className="filter-panel glass-card animate-in" style={{ animationDelay: '0.15s' }}>
            <div className="filter-group">
              <label className="filter-label">Category</label>
              <div className="chip-grid">
                {CATEGORIES.map((cat) => (
                  <button key={cat} className={`chip ${category === cat ? 'chip-active' : ''}`} onClick={() => setCategory(cat)}>
                    {cat}
                  </button>
                ))}
              </div>
            </div>
            <div className="filter-group">
              <label className="filter-label">Ecosystem</label>
              <div className="chip-grid">
                {ECOSYSTEMS.map((eco) => (
                  <button key={eco} className={`chip ${ecosystem === eco ? 'chip-active' : ''}`} onClick={() => setEcosystem(eco)}>
                    {eco}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Products Grid */}
        {loading ? (
          <div className="loading-state">Loading products...</div>
        ) : products.length === 0 ? (
          <div className="empty-state glass-card animate-in">
            <span className="empty-icon">🔍</span>
            <h3>No products found</h3>
            <p>Try adjusting your filters or search term.</p>
          </div>
        ) : (
          <>
            <div className="products-grid animate-in" style={{ animationDelay: '0.2s' }}>
              {products.map((product) => (
                <div key={product.id} className="product-card glass-card">
                  <div className="pc-category">{product.category}</div>
                  <h3 className="pc-name">{product.brand} {product.model}</h3>
                  <div className="pc-meta">
                    <span className="pc-ecosystem">{product.ecosystem}</span>
                    <span className="pc-rating"><HiOutlineStar /> {product.rating.toFixed(1)}</span>
                  </div>
                  <div className="pc-price">{formatPrice(product.price)}</div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination animate-in" style={{ animationDelay: '0.25s' }}>
                <button className="btn btn-sm btn-secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                  <HiOutlineChevronLeft /> Prev
                </button>
                <div className="page-info">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button key={p} className={`page-btn ${p === page ? 'page-active' : ''}`} onClick={() => setPage(p)}>
                      {p}
                    </button>
                  ))}
                </div>
                <button className="btn btn-sm btn-secondary" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                  Next <HiOutlineChevronRight />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
