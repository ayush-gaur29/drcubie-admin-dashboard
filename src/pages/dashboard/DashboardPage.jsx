import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Sparkles,
  Video,
  Headphones,
  Compass,
  Crown,
  CheckCircle2,
  Bell,
  RefreshCw,
  Plus,
  Calendar,
  Layers
} from 'lucide-react';
import KpiCard from '../../components/dashboard/KpiCard';
import RecentContentTable from '../../components/dashboard/RecentContentTable';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import { fetchDashboardKpis, fetchRecentContent } from '../../services/dashboard/dashboardService';
import { useToast } from '../../context/ToastContext';

export const DashboardPage = () => {
  const [kpis, setKpis] = useState(null);
  const [recentItems, setRecentItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const { showToast } = useToast();

  const loadDashboardData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [kpiData, recentData] = await Promise.all([
        fetchDashboardKpis(),
        fetchRecentContent(8)
      ]);
      setKpis(kpiData);
      setRecentItems(recentData);
      if (isRefresh) {
        showToast('success', 'Dashboard metrics synchronized with Supabase.');
      }
    } catch (err) {
      console.error('[DashboardPage] Error loading data:', err);
      showToast('error', 'Failed to synchronize live metrics from Supabase.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  if (loading && !kpis) {
    return <Spinner size={36} text="Loading Supabase performance metrics..." />;
  }

  return (
    <div>
      {/* Top Banner & Quick Controls */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-main)' }}>
            System Performance & Metrics
          </h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Synchronized directly with the Dr. Cubie PostgreSQL database
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Button
            variant="secondary"
            size="sm"
            icon={RefreshCw}
            loading={refreshing}
            onClick={() => loadDashboardData(true)}
          >
            Refresh
          </Button>

          <Link to="/sparks">
            <Button variant="primary" size="sm" icon={Plus}>
              New Spark
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="kpi-grid">
        <KpiCard
          title="Total Users"
          value={kpis?.totalUsers ?? 0}
          subtitle="Registered profiles in database"
          icon={Users}
          color="#2563eb"
          bgColor="#eff6ff"
        />

        <KpiCard
          title="Total Sparks"
          value={kpis?.totalSparks ?? 0}
          subtitle="Wisdom & contemplation modules"
          icon={Sparkles}
          color="#00288e"
          bgColor="#eaedff"
        />

        <KpiCard
          title="Total Videos"
          value={kpis?.totalVideos ?? 0}
          subtitle="Storage video assets"
          icon={Video}
          color="#0891b2"
          bgColor="#ecfeff"
        />

        <KpiCard
          title="Total Audios"
          value={kpis?.totalAudios ?? 0}
          subtitle="Soundscapes & voice sessions"
          icon={Headphones}
          color="#059669"
          bgColor="#ecfdf5"
        />

        <KpiCard
          title="Recommendations"
          value={kpis?.totalRecommendations ?? 0}
          subtitle="Curated feed suggestions"
          icon={Compass}
          color="#d97706"
          bgColor="#fffbeb"
        />

        <KpiCard
          title="VIP Content"
          value={kpis?.vipContentCount ?? 0}
          subtitle="Gated premium assets"
          icon={Crown}
          color="#7c3aed"
          bgColor="#f5f3ff"
        />

        <KpiCard
          title="Published Content"
          value={kpis?.publishedContentCount ?? 0}
          subtitle="Active in consumer mobile app"
          icon={CheckCircle2}
          color="#16a34a"
          bgColor="#f0fdf4"
        />

        <KpiCard
          title="Active Notifications"
          value={kpis?.activeNotificationsCount ?? 0}
          subtitle="Unread user messages"
          icon={Bell}
          color="#ea580c"
          bgColor="#fff7ed"
        />
      </div>

      {/* Quick Launchpad & Scheduling */}
      <div
        className="card"
        style={{
          marginBottom: '1.75rem',
          background: 'linear-gradient(135deg, #1e40af 0%, #172554 100%)',
          color: '#ffffff',
          border: 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.25rem', color: '#ffffff' }}>
              Daily Programming & Publishing
            </h3>
            <p style={{ fontSize: '0.84rem', color: '#bfdbfe', maxWidth: '600px' }}>
              Ensure tomorrow's Spark, Video, and Audio contemplation are scheduled and synchronized for the mobile application.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Link to="/daily-content">
              <Button
                variant="secondary"
                size="md"
                icon={Calendar}
                style={{ backgroundColor: '#ffffff', color: '#0f172a', border: 'none' }}
              >
                Schedule Today Screen
              </Button>
            </Link>
            <Link to="/notifications">
              <Button
                variant="ghost"
                size="md"
                icon={Bell}
                style={{ color: '#ffffff', border: '1px solid rgba(255, 255, 255, 0.3)' }}
              >
                Broadcast Notification
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Content Table */}
      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Layers size={18} color="var(--primary)" />
            <h3 className="card-title">Recently Created & Updated Content</h3>
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Across Sparks, Videos, and Audios
          </span>
        </div>
        <RecentContentTable items={recentItems} />
      </div>
    </div>
  );
};

export default DashboardPage;
