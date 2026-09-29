import React from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, Database, ShieldCheck } from 'lucide-react';
import Badge from '../ui/Badge';

const ROUTE_TITLES = {
  '/dashboard': { title: 'Overview Dashboard', subtitle: 'Real-time performance metrics and content KPIs' },
  '/sparks': { title: 'Sparks Management', subtitle: 'Create, edit, and curate daily wisdom Sparks' },
  '/videos': { title: 'Video Management', subtitle: 'Upload and organize contemplation video assets' },
  '/audios': { title: 'Audio Management', subtitle: 'Curate guided soundscapes and spoken audio' },
  '/recommendations': { title: 'Recommendations', subtitle: 'Configure curated suggestions on mobile cards' },
  '/daily-content': { title: 'Daily Content Schedule', subtitle: 'Schedule and synchronize Today screen features' },
  '/users': { title: 'User Management', subtitle: 'View registered member profiles and VIP access' },
  '/notifications': { title: 'Notification Center', subtitle: 'Broadcast notifications to members or VIPs' },
  '/vip-pass': { title: 'VIP Pass Management', subtitle: 'Manage VIP content catalog, entitlements, and presentation' }
};

export const Header = ({ onOpenMobileMenu }) => {
  const location = useLocation();
  const currentInfo = ROUTE_TITLES[location.pathname] || {
    title: 'Admin Dashboard',
    subtitle: 'Dr. Cubie Inspiration Management'
  };

  return (
    <header className="admin-header">
      <div className="header-left">
        <button
          onClick={onOpenMobileMenu}
          className="mobile-menu-btn"
          aria-label="Open mobile menu"
        >
          <Menu size={22} />
        </button>

        <div className="header-title-box">
          <h1 className="header-title">{currentInfo.title}</h1>
          <span className="header-subtitle">{currentInfo.subtitle}</span>
        </div>
      </div>


    </header>
  );
};

export default Header;
