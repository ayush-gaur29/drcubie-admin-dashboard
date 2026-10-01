import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Sparkles,
  Video,
  Headphones,
  Compass,
  Calendar,
  Users,
  Bell,
  Crown,
  CreditCard,
  LogOut,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/sparks', label: 'Sparks', icon: Sparkles },
  { path: '/videos', label: 'Videos', icon: Video },
  { path: '/audios', label: 'Audios', icon: Headphones },
  { path: '/recommendations', label: 'Recommendations', icon: Compass },
  { path: '/daily-content', label: 'Daily Content', icon: Calendar },
  { path: '/users', label: 'Users', icon: Users },
  { path: '/notifications', label: 'Notifications', icon: Bell },
  { path: '/vip-pass', label: 'VIP Pass', icon: Crown },
  { path: '/payments', label: 'Payments', icon: CreditCard }
];

export const Sidebar = ({ isOpen, onClose }) => {
  const { user, profile, signOut } = useAuth();

  const handleLinkClick = () => {
    if (onClose) onClose();
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Admin';
  const displayRole = profile?.role || 'admin';

  return (
    <aside className={`admin-sidebar ${isOpen ? 'sidebar-open' : ''}`}>
      {/* Brand Header */}
      <div className="sidebar-brand">
        <div className="brand-icon-box">
          <img src="/logo.png" alt="Dr. Cubie Logo" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="brand-title">Dr. Cubie</div>
          <div style={{ fontSize: '0.7rem', color: '#93c5fd' }}>Inspiration Console</div>
        </div>
        <span className="brand-badge">Admin</span>
        {/* Mobile close button */}
        {isOpen && (
          <button
            onClick={onClose}
            className="mobile-menu-btn"
            style={{ color: '#ffffff', display: 'flex', marginLeft: 'auto' }}
            aria-label="Close Sidebar"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="sidebar-nav">
        <span className="nav-section-title">Management</span>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={handleLinkClick}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''}`
              }
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* User Card & Sign Out */}
      <div className="sidebar-footer">
        <div className="sidebar-user-card">
          <div className="user-avatar-circle">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt={displayName} />
            ) : (
              displayName.charAt(0).toUpperCase()
            )}
          </div>
          <div className="user-info-text">
            <div className="user-info-name" title={displayName}>
              {displayName}
            </div>
            <div className="user-info-role">Role: {displayRole}</div>
          </div>
        </div>

        <button onClick={handleSignOut} className="btn-signout" title="Sign out of Admin Dashboard">
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
