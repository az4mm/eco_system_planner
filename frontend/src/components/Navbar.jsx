// Navbar component — persistent top navigation with profile dropdown
import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { HiOutlineBookmark, HiOutlineViewGrid, HiOutlineLogout, HiOutlineUser, HiOutlineCube, HiOutlinePencil, HiOutlineCheck, HiOutlineX, HiOutlineKey } from 'react-icons/hi';
import './Navbar.css';

const ECOSYSTEMS = ['Apple', 'Android', 'Windows', 'Linux', 'Mixed'];

export default function Navbar() {
  const { user, isAuthenticated, logout, updateProfile } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // Profile dropdown state
  const [showProfile, setShowProfile] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', preferred_ecosystem: '' });
  const [saving, setSaving] = useState(false);

  // Password change state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [pwSaving, setPwSaving] = useState(false);

  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowProfile(false);
        setEditing(false);
        setShowPasswordForm(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync form with user data when opening
  useEffect(() => {
    if (user && showProfile) {
      setForm({ name: user.name || '', email: user.email || '', preferred_ecosystem: user.preferred_ecosystem || '' });
    }
  }, [user, showProfile]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const toggleProfile = () => {
    setShowProfile(!showProfile);
    setEditing(false);
    setShowPasswordForm(false);
  };

  const handleSave = async () => {
    // Same validation as RegisterPage
    if (form.name.trim().length < 2) {
      toast.error('Name must be at least 2 characters');
      return;
    }
    if (!/^[a-zA-Z\s]+$/.test(form.name.trim())) {
      toast.error('Name can only contain letters and spaces');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setSaving(true);
    try {
      const res = await api.put('/api/v1/auth/me', {
        name: form.name.trim(),
        email: form.email.trim(),
        preferred_ecosystem: form.preferred_ecosystem || null,
      });
      updateProfile(res.data);
      setEditing(false);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (pwForm.new_password !== pwForm.confirm_password) {
      toast.error('New passwords do not match');
      return;
    }
    if (pwForm.new_password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (!/[A-Za-z]/.test(pwForm.new_password) || !/[0-9]/.test(pwForm.new_password)) {
      toast.error('Password must contain both letters and numbers');
      return;
    }
    setPwSaving(true);
    try {
      await api.put('/api/v1/auth/me/password', {
        current_password: pwForm.current_password,
        new_password: pwForm.new_password,
      });
      toast.success('Password changed successfully!');
      setShowPasswordForm(false);
      setPwForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to change password');
    } finally {
      setPwSaving(false);
    }
  };

  // Do not show this navbar on the admin page
  if (pathname === '/admin') {
    return null;
  }

  return (
    <nav className="navbar">
      <div className="navbar-inner container">
        <Link to={isAuthenticated ? '/dashboard' : '/'} className="navbar-logo">
          <span className="logo-icon">⚡</span>
          <span className="logo-text">TechPlanner</span>
        </Link>

        {isAuthenticated && (
          <div className="navbar-links">
            <Link to="/dashboard" className={`nav-link ${pathname === '/dashboard' ? 'active' : ''}`}>
              <HiOutlineViewGrid /> Dashboard
            </Link>
            <Link to="/saved" className={`nav-link ${pathname === '/saved' ? 'active' : ''}`}>
              <HiOutlineBookmark /> Saved
            </Link>
            <Link to="/products" className={`nav-link ${pathname === '/products' ? 'active' : ''}`}>
              <HiOutlineCube /> Products
            </Link>
          </div>
        )}

        <div className="navbar-right">
          {isAuthenticated ? (
            <div className="profile-wrapper" ref={dropdownRef}>
              <button className="profile-trigger" onClick={toggleProfile}>
                <span className="profile-avatar">{user?.name?.charAt(0).toUpperCase()}</span>
                <span className="profile-name">{user?.name}</span>
              </button>

              {showProfile && (
                <div className="profile-dropdown animate-in">
                  <div className="profile-dropdown-header">
                    <div className="profile-avatar-lg">{user?.name?.charAt(0).toUpperCase()}</div>
                    <div>
                      <h3 className="profile-display-name">{user?.name}</h3>
                      <p className="profile-display-email">{user?.email}</p>
                    </div>
                    {!editing && !showPasswordForm && (
                      <button className="btn-icon profile-edit-btn" onClick={() => setEditing(true)} title="Edit Profile">
                        <HiOutlinePencil />
                      </button>
                    )}
                  </div>

                  {editing ? (
                    <div className="profile-edit-form">
                      <div className="profile-field">
                        <label className="profile-field-label">Name</label>
                        <input className="form-input form-input-sm" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                      </div>
                      <div className="profile-field">
                        <label className="profile-field-label">Email</label>
                        <input type="email" className="form-input form-input-sm" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                      </div>
                      <div className="profile-field">
                        <label className="profile-field-label">Preferred Ecosystem</label>
                        <select className="form-select form-input-sm" value={form.preferred_ecosystem} onChange={(e) => setForm({ ...form, preferred_ecosystem: e.target.value })}>
                          <option value="">None</option>
                          {ECOSYSTEMS.map((e) => <option key={e} value={e}>{e}</option>)}
                        </select>
                      </div>
                      <div className="profile-edit-actions">
                        <button className="btn btn-sm btn-secondary" onClick={() => setEditing(false)} disabled={saving}>
                          <HiOutlineX /> Cancel
                        </button>
                        <button className="btn btn-sm btn-primary" onClick={handleSave} disabled={saving}>
                          <HiOutlineCheck /> {saving ? 'Saving...' : 'Save'}
                        </button>
                      </div>
                    </div>
                  ) : showPasswordForm ? (
                    <div className="profile-edit-form">
                      <div className="profile-field">
                        <label className="profile-field-label">Current Password</label>
                        <input type="password" className="form-input form-input-sm" placeholder="••••••••" value={pwForm.current_password} onChange={(e) => setPwForm({ ...pwForm, current_password: e.target.value })} />
                      </div>
                      <div className="profile-field">
                        <label className="profile-field-label">New Password</label>
                        <input type="password" className="form-input form-input-sm" placeholder="Min 6 characters" value={pwForm.new_password} onChange={(e) => setPwForm({ ...pwForm, new_password: e.target.value })} />
                      </div>
                      <div className="profile-field">
                        <label className="profile-field-label">Confirm New Password</label>
                        <input type="password" className="form-input form-input-sm" placeholder="••••••••" value={pwForm.confirm_password} onChange={(e) => setPwForm({ ...pwForm, confirm_password: e.target.value })} />
                      </div>
                      <div className="profile-edit-actions">
                        <button className="btn btn-sm btn-secondary" onClick={() => { setShowPasswordForm(false); setPwForm({ current_password: '', new_password: '', confirm_password: '' }); }} disabled={pwSaving}>
                          <HiOutlineX /> Cancel
                        </button>
                        <button className="btn btn-sm btn-primary" onClick={handlePasswordChange} disabled={pwSaving}>
                          <HiOutlineCheck /> {pwSaving ? 'Saving...' : 'Update'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="profile-info">
                      <div className="profile-info-row">
                        <span className="profile-info-label">Ecosystem</span>
                        <span className="profile-info-value">{user?.preferred_ecosystem || 'Not set'}</span>
                      </div>
                    </div>
                  )}

                  {!editing && !showPasswordForm && (
                    <div className="profile-dropdown-footer">
                      <button onClick={() => setShowPasswordForm(true)} className="btn btn-sm btn-secondary profile-password-btn">
                        <HiOutlineKey /> Change Password
                      </button>
                      <button onClick={handleLogout} className="btn btn-sm btn-secondary profile-logout-btn">
                        <HiOutlineLogout /> Logout
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="btn btn-sm btn-secondary">Login</Link>
              <Link to="/register" className="btn btn-sm btn-primary">Sign Up</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
