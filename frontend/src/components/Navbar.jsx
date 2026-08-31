// Navbar component — persistent top navigation
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { HiOutlineBookmark, HiOutlineScale, HiOutlineViewGrid, HiOutlineLogout, HiOutlineUser } from 'react-icons/hi';
import './Navbar.css';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner container">
        <Link to={isAuthenticated ? '/dashboard' : '/'} className="navbar-logo">
          <span className="logo-icon">⚡</span>
          <span className="logo-text">TechPlanner</span>
        </Link>

        {isAuthenticated && (
          <div className="navbar-links">
            <Link to="/dashboard" className="nav-link">
              <HiOutlineViewGrid /> Dashboard
            </Link>
            <Link to="/saved" className="nav-link">
              <HiOutlineBookmark /> Saved
            </Link>
            <Link to="/compare" className="nav-link">
              <HiOutlineScale /> Compare
            </Link>
          </div>
        )}

        <div className="navbar-right">
          {isAuthenticated ? (
            <>
              <span className="user-greeting">
                <HiOutlineUser /> {user?.name}
              </span>
              <button onClick={handleLogout} className="btn btn-sm btn-secondary">
                <HiOutlineLogout /> Logout
              </button>
            </>
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
