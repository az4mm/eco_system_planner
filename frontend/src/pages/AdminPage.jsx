// Admin Dashboard — login gate + stats + product CRUD + admin management
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../services/adminService';
import { productService } from '../services/productService';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineChevronLeft, HiOutlineChevronRight, HiOutlineLockClosed, HiOutlineUserGroup, HiOutlineShieldCheck } from 'react-icons/hi';
import './AdminPage.css';

const CATEGORIES = ['Laptop', 'Smartphone', 'Earbuds', 'Smartwatch', 'Accessories'];
const ECOSYSTEMS = ['Apple', 'Android', 'Windows', 'Linux', 'Universal'];
const PER_PAGE = 10;

const emptyProduct = { brand: '', model: '', category: 'Laptop', price: '', rating: '', ecosystem: 'Universal', is_active: true };

export default function AdminPage() {
  // Admin auth state
  const [isAdminAuth, setIsAdminAuth] = useState(false);
  const [adminUser, setAdminUser] = useState(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Dashboard state
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ ...emptyProduct });

  // Admin management state
  const [activeTab, setActiveTab] = useState('products'); // 'products' | 'admins'
  const [admins, setAdmins] = useState([]);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ username: '', password: '' });

  // Admin self-update state
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileForm, setProfileForm] = useState({ username: '', current_password: '', new_password: '', confirm_password: '' });
  const [profileSaving, setProfileSaving] = useState(false);

  const isSuperAdmin = adminUser?.role === 'superadmin';

  // Check if admin token exists
  useEffect(() => {
    const token = sessionStorage.getItem('admin_token');
    const admin = sessionStorage.getItem('admin_user');
    if (token && admin) {
      setIsAdminAuth(true);
      setAdminUser(JSON.parse(admin));
    }
  }, []);

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    try {
      const data = await adminService.adminLogin(username, password);
      sessionStorage.setItem('admin_token', data.access_token);
      sessionStorage.setItem('admin_user', JSON.stringify(data.admin));
      setIsAdminAuth(true);
      setAdminUser(data.admin);
      toast.success(`Welcome, ${data.admin.username}! (${data.admin.role})`);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Invalid admin credentials');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleAdminLogout = () => {
    sessionStorage.removeItem('admin_token');
    sessionStorage.removeItem('admin_user');
    setIsAdminAuth(false);
    setAdminUser(null);
  };

  const openProfileModal = () => {
    setProfileForm({ username: adminUser?.username || '', current_password: '', new_password: '', confirm_password: '' });
    setShowProfileModal(true);
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    const payload = {};

    // Username change
    if (profileForm.username && profileForm.username !== adminUser.username) {
      if (profileForm.username.length < 3) { toast.error('Username must be at least 3 characters'); return; }
      payload.username = profileForm.username;
    }

    // Password change
    if (profileForm.new_password) {
      if (!profileForm.current_password) { toast.error('Enter your current password'); return; }
      if (profileForm.new_password.length < 6) { toast.error('New password must be at least 6 characters'); return; }
      if (profileForm.new_password !== profileForm.confirm_password) { toast.error('Passwords do not match'); return; }
      payload.current_password = profileForm.current_password;
      payload.new_password = profileForm.new_password;
    }

    if (Object.keys(payload).length === 0) { toast.error('No changes to save'); return; }

    setProfileSaving(true);
    try {
      const updated = await adminService.updateAdminSelf(adminUser.id, payload);
      const newAdminData = { ...adminUser, username: updated.username };
      setAdminUser(newAdminData);
      sessionStorage.setItem('admin_user', JSON.stringify(newAdminData));
      setShowProfileModal(false);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update profile');
    } finally {
      setProfileSaving(false);
    }
  };

  const loadStats = async () => {
    try { setStats(await adminService.getStats()); } catch {}
  };

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await productService.getProducts({ page, perPage: PER_PAGE, sortBy: 'name' });
      setProducts(data.products);
      setTotal(data.total);
      setTotalPages(data.total_pages);
    } catch { toast.error('Failed to load products'); }
    finally { setLoading(false); }
  }, [page]);

  const loadAdmins = async () => {
    try { setAdmins(await adminService.listAdmins()); } catch {}
  };

  useEffect(() => {
    if (isAdminAuth) { loadStats(); loadProducts(); loadAdmins(); }
  }, [isAdminAuth, loadProducts]);

  // Product handlers
  const openCreate = () => { setEditingId(null); setForm({ ...emptyProduct }); setShowModal(true); };
  const openEdit = (product) => {
    setEditingId(product.id);
    setForm({ brand: product.brand, model: product.model, category: product.category, price: product.price, rating: product.rating, ecosystem: product.ecosystem, is_active: product.is_active });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = { ...form, price: parseFloat(form.price), rating: parseFloat(form.rating) };
    try {
      if (editingId) { await adminService.updateProduct(editingId, data); toast.success('Product updated'); }
      else { await adminService.createProduct(data); toast.success('Product created'); }
      setShowModal(false); loadStats(); loadProducts();
    } catch (err) { toast.error(err.response?.data?.detail || 'Failed to save product'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this product?')) return;
    try { await adminService.deleteProduct(id); toast.success('Product deleted'); loadStats(); loadProducts(); }
    catch { toast.error('Failed to delete'); }
  };

  // Admin handlers
  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    if (newAdmin.username.length < 3) { toast.error('Username must be at least 3 characters'); return; }
    if (newAdmin.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    try {
      await adminService.createAdmin(newAdmin.username, newAdmin.password, adminUser.id);
      toast.success('Admin created!');
      setShowAdminModal(false);
      setNewAdmin({ username: '', password: '' });
      loadAdmins();
    } catch (err) { toast.error(err.response?.data?.detail || 'Failed to create admin'); }
  };

  const handleDeleteAdmin = async (id) => {
    if (!confirm('Delete this admin account?')) return;
    try {
      await adminService.deleteAdmin(id, adminUser.id);
      toast.success('Admin deleted');
      loadAdmins();
    } catch (err) { toast.error(err.response?.data?.detail || 'Failed to delete admin'); }
  };

  const formatPrice = (p) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(p);

  // ── Admin Login Gate ──
  if (!isAdminAuth) {
    return (
      <div className="auth-page">
        <div className="auth-card glass-card animate-in">
          <div className="auth-header">
            <h2><HiOutlineLockClosed /> Admin Login</h2>
            <p>Enter admin credentials to access the dashboard</p>
          </div>
          <form onSubmit={handleAdminLogin} className="auth-form">
            <div className="form-group">
              <label className="form-label">Username</label>
              <input type="text" className="form-input" placeholder="admin" value={username} onChange={(e) => setUsername(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input type="password" className="form-input" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <button type="submit" className="btn btn-primary btn-lg auth-btn" disabled={loginLoading}>
              {loginLoading ? 'Logging in...' : 'Login as Admin'}
            </button>
          </form>
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <Link to="/" className="btn btn-sm btn-secondary">
              &larr; Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Admin Dashboard ──
  return (
    <div className="page">
      <div className="container">
        <div className="page-header animate-in" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1>🛠️ Admin Dashboard</h1>
            <p>Logged in as <strong>{adminUser?.username}</strong> <span className={`role-badge role-${adminUser?.role}`}>{adminUser?.role}</span></p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={openProfileModal} className="btn btn-sm btn-secondary"><HiOutlinePencil /> My Profile</button>
            <button onClick={handleAdminLogout} className="btn btn-sm btn-secondary">Logout Admin</button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="stats-grid animate-in" style={{ animationDelay: '0.1s' }}>
            <div className="stat-card glass-card">
              <span className="stat-value">{stats.total_products}</span>
              <span className="stat-label">Total Products</span>
            </div>
            <div className="stat-card glass-card">
              <span className="stat-value">{stats.active_products}</span>
              <span className="stat-label">Active</span>
            </div>
            {Object.entries(stats.by_category).map(([cat, count]) => (
              <div key={cat} className="stat-card glass-card">
                <span className="stat-value">{count}</span>
                <span className="stat-label">{cat}</span>
              </div>
            ))}
          </div>
        )}

        {/* Tab Switcher */}
        <div className="admin-tabs animate-in" style={{ animationDelay: '0.15s' }}>
          <button className={`admin-tab ${activeTab === 'products' ? 'admin-tab-active' : ''}`} onClick={() => setActiveTab('products')}>
            📦 Products
          </button>
          <button className={`admin-tab ${activeTab === 'admins' ? 'admin-tab-active' : ''}`} onClick={() => setActiveTab('admins')}>
            <HiOutlineUserGroup /> Admins
          </button>
        </div>

        {/* Products Tab */}
        {activeTab === 'products' && (
          <div className="admin-table-section glass-card animate-in" style={{ animationDelay: '0.2s' }}>
            <div className="table-header">
              <h2>Products ({total})</h2>
              <button onClick={openCreate} className="btn btn-primary btn-sm">
                <HiOutlinePlus /> Add Product
              </button>
            </div>
            {loading ? (
              <div className="loading-state">Loading...</div>
            ) : (
              <div className="table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>ID</th><th>Brand</th><th>Model</th><th>Category</th><th>Ecosystem</th><th>Price</th><th>Rating</th><th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p) => (
                      <tr key={p.id}>
                        <td>{p.id}</td>
                        <td>{p.brand}</td>
                        <td>{p.model}</td>
                        <td><span className="table-badge">{p.category}</span></td>
                        <td>{p.ecosystem}</td>
                        <td>{formatPrice(p.price)}</td>
                        <td>⭐ {p.rating.toFixed(1)}</td>
                        <td>
                          <div className="table-actions">
                            <button onClick={() => openEdit(p)} className="btn btn-sm btn-secondary" title="Edit"><HiOutlinePencil /></button>
                            <button onClick={() => handleDelete(p.id)} className="btn btn-sm btn-danger" title="Delete"><HiOutlineTrash /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {totalPages > 1 && (
              <div className="pagination">
                <button className="btn btn-sm btn-secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                  <HiOutlineChevronLeft /> Prev
                </button>
                <div className="page-info">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button key={p} className={`page-btn ${p === page ? 'page-active' : ''}`} onClick={() => setPage(p)}>{p}</button>
                  ))}
                </div>
                <button className="btn btn-sm btn-secondary" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                  Next <HiOutlineChevronRight />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Admins Tab */}
        {activeTab === 'admins' && (
          <div className="admin-table-section glass-card animate-in" style={{ animationDelay: '0.2s' }}>
            <div className="table-header">
              <h2><HiOutlineUserGroup /> Admin Accounts ({admins.length})</h2>
              {isSuperAdmin && (
                <button onClick={() => setShowAdminModal(true)} className="btn btn-primary btn-sm">
                  <HiOutlinePlus /> Add Admin
                </button>
              )}
            </div>
            <div className="table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th><th>Username</th><th>Role</th><th>Created</th>{isSuperAdmin && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {admins.map((a) => (
                    <tr key={a.id}>
                      <td>{a.id}</td>
                      <td>{a.username}</td>
                      <td>
                        <span className={`role-badge role-${a.role}`}>
                          {a.role === 'superadmin' ? <><HiOutlineShieldCheck /> superadmin</> : 'admin'}
                        </span>
                      </td>
                      <td>{new Date(a.created_at).toLocaleDateString()}</td>
                      {isSuperAdmin && (
                        <td>
                          {a.role !== 'superadmin' ? (
                            <button onClick={() => handleDeleteAdmin(a.id)} className="btn btn-sm btn-danger" title="Delete">
                              <HiOutlineTrash />
                            </button>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Protected</span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!isSuperAdmin && (
              <div className="admin-info-note">
                <HiOutlineShieldCheck /> Only superadmins can remove admin accounts. Contact your superadmin.
              </div>
            )}
          </div>
        )}

        {/* Product Add/Edit Modal */}
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content glass-card animate-in" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{editingId ? 'Edit Product' : 'Add Product'}</h2>
                <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
              </div>
              <form onSubmit={handleSubmit} className="modal-body admin-form">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Brand</label>
                    <input className="form-input" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Model</label>
                    <input className="form-input" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} required />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select className="form-select" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                      {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Ecosystem</label>
                    <select className="form-select" value={form.ecosystem} onChange={(e) => setForm({ ...form, ecosystem: e.target.value })}>
                      {ECOSYSTEMS.map((e) => <option key={e} value={e}>{e}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Price (₹)</label>
                    <input type="number" className="form-input" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required min="1" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Rating (1-5)</label>
                    <input type="number" className="form-input" value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })} required min="1" max="5" step="0.1" />
                  </div>
                </div>
                <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }}>
                  {editingId ? 'Update Product' : 'Create Product'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Add Admin Modal */}
        {showAdminModal && (
          <div className="modal-overlay" onClick={() => setShowAdminModal(false)}>
            <div className="modal-content glass-card animate-in" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
              <div className="modal-header">
                <h2><HiOutlineUserGroup /> Add Admin</h2>
                <button className="modal-close" onClick={() => setShowAdminModal(false)}>✕</button>
              </div>
              <form onSubmit={handleCreateAdmin} className="modal-body admin-form">
                <div className="form-group">
                  <label className="form-label">Username</label>
                  <input className="form-input" placeholder="new_admin" value={newAdmin.username} onChange={(e) => setNewAdmin({ ...newAdmin, username: e.target.value })} required minLength={3} />
                </div>
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input type="password" className="form-input" placeholder="Min 6 characters" value={newAdmin.password} onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })} required minLength={6} />
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                  New admins are created with the <strong>admin</strong> role. Only the <strong>superadmin</strong> role can be assigned directly in the database.
                </p>
                <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }}>
                  Create Admin
                </button>
              </form>
            </div>
          </div>
        )}
        {/* Admin Profile Settings Modal */}
        {showProfileModal && (
          <div className="modal-overlay" onClick={() => setShowProfileModal(false)}>
            <div className="modal-content glass-card animate-in" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px' }}>
              <div className="modal-header">
                <h2><HiOutlinePencil /> My Profile</h2>
                <button className="modal-close" onClick={() => setShowProfileModal(false)}>✕</button>
              </div>
              <form onSubmit={handleProfileSave} className="modal-body admin-form">
                <div className="form-group">
                  <label className="form-label">Username</label>
                  <input className="form-input" value={profileForm.username} onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })} required minLength={3} />
                </div>

                <div className="form-group">
                  <label className="form-label">Role</label>
                  <input className="form-input" value={adminUser?.role} disabled style={{ opacity: 0.5, cursor: 'not-allowed' }} />
                  <span className="form-hint" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Role can only be changed directly in the database</span>
                </div>

                <hr style={{ border: 'none', borderTop: '1px solid var(--border-glass)', margin: '4px 0' }} />

                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>Change Password <span style={{ fontSize: '0.75rem' }}>(leave blank to keep current)</span></p>

                <div className="form-group">
                  <label className="form-label">Current Password</label>
                  <input type="password" className="form-input" placeholder="••••••••" value={profileForm.current_password} onChange={(e) => setProfileForm({ ...profileForm, current_password: e.target.value })} />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">New Password</label>
                    <input type="password" className="form-input" placeholder="Min 6 chars" value={profileForm.new_password} onChange={(e) => setProfileForm({ ...profileForm, new_password: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Confirm</label>
                    <input type="password" className="form-input" placeholder="••••••••" value={profileForm.confirm_password} onChange={(e) => setProfileForm({ ...profileForm, confirm_password: e.target.value })} />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={profileSaving}>
                  {profileSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
