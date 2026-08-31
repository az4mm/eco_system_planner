// Register Page
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './AuthPages.css';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [ecosystem, setEcosystem] = useState('');
  const [loading, setLoading] = useState(false);
  const { register, login } = useAuth();
  const navigate = useNavigate();

  const validateForm = () => {
    if (name.trim().length < 2) {
      toast.error('Name must be at least 2 characters');
      return false;
    }
    if (!/^[a-zA-Z\s]+$/.test(name.trim())) {
      toast.error('Name can only contain letters and spaces');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address');
      return false;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return false;
    }
    if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      toast.error('Password must contain both letters and numbers');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      await register(name.trim(), email.trim(), password, ecosystem || null);
      // Auto-login after successful registration
      await login(email.trim(), password);
      toast.success('Account created — welcome!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card glass-card animate-in">
        <div className="auth-header">
          <h2>Create Account</h2>
          <p>Join TechPlanner and build your ecosystem</p>
        </div>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input type="text" className="form-input" placeholder="Rahul Sharma" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input type="email" className="form-input" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input type="password" className="form-input" placeholder="Letters + numbers, 6+ chars" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
            <span className="form-hint">Must contain both letters and numbers</span>
          </div>
          <div className="form-group">
            <label className="form-label">Preferred Ecosystem (optional)</label>
            <select className="form-select" value={ecosystem} onChange={(e) => setEcosystem(e.target.value)}>
              <option value="">Select an ecosystem</option>
              <option value="Apple">Apple</option>
              <option value="Android">Android</option>
              <option value="Windows">Windows</option>
              <option value="Linux">Linux</option>
              <option value="Mixed">Mixed</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary btn-lg auth-btn" disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>
        <p className="auth-footer">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}
