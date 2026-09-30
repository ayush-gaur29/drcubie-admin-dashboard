import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Crown,
  Sparkles,
  Video,
  Headphones,
  Users,
  ShieldCheck,
  Plus,
  RefreshCw,
  Eye,
  CheckCircle2,
  XCircle,
  Search,
  Sliders,
  Star,
  ExternalLink,
  UserCheck,
  UserX,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Modal from '../../components/ui/Modal';
import MediaPreviewModal from '../../components/content/MediaPreviewModal';
import {
  fetchVipKpis,
  fetchUnifiedContent,
  toggleContentVip,
  setFeaturedVipContent,
  fetchNonVipCandidates,
  fetchVipMembers,
  fetchStandardMembers,
  toggleMemberVip,
  getLocalVipSettings,
  saveLocalVipSettings
} from '../../services/vipPass/vipPassAdminService';
import { useToast } from '../../context/ToastContext';
import { formatDate } from '../../utils/formatters';
import PlanFormModal from '../../components/plans/PlanFormModal';
import MembershipPlansSection from '../../components/plans/MembershipPlansSection';
import {
  fetchMembershipPlans,
  createMembershipPlan,
  updateMembershipPlan,
  toggleMembershipPlanStatus,
  deleteMembershipPlan,
  isTableMissingError
} from '../../services/membershipPlans/membershipPlansAdminService';

const TYPE_OPTIONS = [
  { value: 'all', label: 'All Content Types' },
  { value: 'spark', label: 'Sparks Only' },
  { value: 'video', label: 'Videos Only' },
  { value: 'audio', label: 'Audios Only' }
];

const VIP_FILTER_OPTIONS = [
  { value: 'all', label: 'All Access Levels' },
  { value: 'vip', label: 'VIP Exclusive Only' },
  { value: 'non-vip', label: 'Standard (Free)' }
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Draft' },
  { value: 'archived', label: 'Archived' }
];

export const VipPassPage = () => {
  // KPIs
  const [kpis, setKpis] = useState({
    vipMembers: 0,
    vipVideos: 0,
    vipAudios: 0,
    vipSparks: 0,
    activeVipContent: 0,
    totalContent: 0
  });

  // Content state
  const [contentList, setContentList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [selectedType, setSelectedType] = useState('all');
  const [selectedVipFilter, setSelectedVipFilter] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // VIP Members state
  const [vipMembers, setVipMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);

  // VIP Settings & Presentation state
  const [vipSettings, setVipSettings] = useState(getLocalVipSettings());
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [settingsFormData, setSettingsFormData] = useState(getLocalVipSettings());

  // Add VIP Content Modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addType, setAddType] = useState('spark');
  const [addContentId, setAddContentId] = useState('');
  const [makeFeaturedOnAdd, setMakeFeaturedOnAdd] = useState(false);
  const [candidates, setCandidates] = useState({ sparks: [], videos: [], audios: [] });
  const [addLoading, setAddLoading] = useState(false);

  // Grant VIP Member Modal
  const [grantModalOpen, setGrantModalOpen] = useState(false);
  const [grantUserId, setGrantUserId] = useState('');
  const [standardMembers, setStandardMembers] = useState([]);
  const [grantLoading, setGrantLoading] = useState(false);

  // Confirm dialog
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmLoading, setConfirmLoading] = useState(false);

  // Preview Modal
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState(null);

  // Membership Plans state
  const [plans, setPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [plansTableMissing, setPlansTableMissing] = useState(false);
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [planSaving, setPlanSaving] = useState(false);

  const { showToast } = useToast();

  // Load membership plans directly from Supabase
  const loadPlans = useCallback(async () => {
    setPlansLoading(true);
    try {
      const data = await fetchMembershipPlans();
      setPlans(data || []);
      setPlansTableMissing(false);
    } catch (err) {
      if (err.code === 'TABLE_NOT_FOUND' || isTableMissingError(err)) {
        setPlansTableMissing(true);
      } else {
        console.error('[VipPassPage] Error fetching membership plans:', err);
      }
      setPlans([]);
    } finally {
      setPlansLoading(false);
    }
  }, []);

  // Load all data
  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [kpisData, contentData, membersData] = await Promise.all([
        fetchVipKpis(),
        fetchUnifiedContent({
          type: selectedType,
          vipFilter: selectedVipFilter,
          status: selectedStatus,
          search: searchQuery
        }),
        fetchVipMembers()
      ]);

      setKpis(kpisData);
      setContentList(contentData || []);
      setVipMembers(membersData || []);
      setVipSettings(getLocalVipSettings());

      // Fetch dynamic membership plans concurrently
      await loadPlans();

      if (isRefresh) {
        showToast('success', 'VIP Pass data refreshed from Supabase.');
      }
    } catch (err) {
      console.error('[VipPassPage] loadData error:', err);
      showToast('error', 'Failed to load VIP Pass management data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedType, selectedVipFilter, selectedStatus, searchQuery, showToast, loadPlans]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Membership Plans handlers
  const handleOpenCreatePlan = () => {
    setEditingPlan(null);
    setPlanModalOpen(true);
  };

  const handleOpenEditPlan = (plan) => {
    setEditingPlan(plan);
    setPlanModalOpen(true);
  };

  const handleSavePlan = async (formData) => {
    setPlanSaving(true);
    try {
      if (editingPlan?.id) {
        await updateMembershipPlan(editingPlan.id, formData);
        showToast('success', `Membership plan "${formData.name}" updated successfully.`);
      } else {
        await createMembershipPlan(formData);
        showToast('success', `Membership plan "${formData.name}" created successfully.`);
      }
      setPlanModalOpen(false);
      setEditingPlan(null);
      await loadPlans();
    } catch (err) {
      if (err.code === 'TABLE_NOT_FOUND' || isTableMissingError(err)) {
        setPlansTableMissing(true);
        showToast('error', "Database table 'membership_plans' not found. Please run the migration SQL.");
      } else {
        showToast('error', err.message || 'Failed to save membership plan.');
      }
    } finally {
      setPlanSaving(false);
    }
  };

  const handleTogglePlanStatus = async (plan) => {
    const nextStatus = !plan.is_active;
    try {
      await toggleMembershipPlanStatus(plan.id, nextStatus);
      showToast(
        'success',
        `Plan "${plan.name}" is now ${nextStatus ? 'active' : 'inactive'}.`
      );
      await loadPlans();
    } catch (err) {
      showToast('error', err.message || 'Failed to update plan status.');
    }
  };

  const handleDeletePlan = (plan) => {
    setConfirmTitle(`Delete Plan "${plan.name}"?`);
    setConfirmMessage(
      `Are you sure you want to permanently delete the "${plan.name}" membership plan? This action removes the plan record from the database and cannot be undone.`
    );
    setConfirmAction(() => async () => {
      setConfirmLoading(true);
      try {
        await deleteMembershipPlan(plan.id);
        showToast('success', `Plan "${plan.name}" was permanently deleted.`);
        setConfirmOpen(false);
        await loadPlans();
      } catch (err) {
        showToast('error', err.message || 'Failed to delete plan.');
      } finally {
        setConfirmLoading(false);
      }
    });
    setConfirmOpen(true);
  };

  // Open Add VIP Content modal
  const handleOpenAddContent = async () => {
    try {
      const cands = await fetchNonVipCandidates();
      setCandidates(cands);
      setAddType('spark');
      setAddContentId(cands.sparks[0]?.id || '');
      setMakeFeaturedOnAdd(false);
      setAddModalOpen(true);
    } catch (err) {
      console.error('Error loading candidates:', err);
      showToast('error', 'Failed to load eligible content.');
    }
  };

  // Submit Add VIP Content
  const handleSaveAddContent = async (e) => {
    e.preventDefault();
    if (!addContentId) {
      showToast('error', 'Please select a content item.');
      return;
    }

    setAddLoading(true);
    try {
      await toggleContentVip(addType, addContentId, true);
      if (makeFeaturedOnAdd) {
        await setFeaturedVipContent(addType, addContentId);
      }
      showToast('success', 'Content item added to VIP Pass catalog.');
      setAddModalOpen(false);
      await loadData();
    } catch (err) {
      console.error('Add VIP content error:', err);
      showToast('error', err.message || 'Failed to add content to VIP Pass.');
    } finally {
      setAddLoading(false);
    }
  };

  // Toggle Content VIP status
  const handleToggleContentVip = async (item) => {
    const newVip = !item.is_vip;
    try {
      await toggleContentVip(item.content_type, item.id, newVip);
      if (!newVip && item.is_featured) {
        // If removing VIP from featured item, clear featured tag
        await setFeaturedVipContent(null, null);
      }
      showToast(
        'success',
        `"${item.title}" is now ${newVip ? 'VIP Exclusive' : 'Public (Free)'}.`
      );
      await loadData();
    } catch (err) {
      console.error('Toggle VIP error:', err);
      showToast('error', 'Failed to update VIP status.');
    }
  };

  // Set / Unset Featured item
  const handleSetFeatured = async (item) => {
    try {
      if (item.is_featured) {
        await setFeaturedVipContent(null, null);
        showToast('success', `Removed "${item.title}" as featured VIP item.`);
      } else {
        await setFeaturedVipContent(item.content_type, item.id);
        showToast('success', `"${item.title}" is now the Featured VIP highlight.`);
      }
      await loadData();
    } catch (err) {
      console.error('Set featured error:', err);
      showToast('error', 'Failed to update featured content.');
    }
  };

  // Open Grant VIP Member modal
  const handleOpenGrantVip = async () => {
    try {
      const list = await fetchStandardMembers();
      setStandardMembers(list);
      setGrantUserId(list[0]?.id || '');
      setGrantModalOpen(true);
    } catch (err) {
      console.error('Error fetching standard users:', err);
      showToast('error', 'Failed to load member directory.');
    }
  };

  // Submit Grant VIP
  const handleSaveGrantVip = async (e) => {
    e.preventDefault();
    if (!grantUserId) {
      showToast('error', 'Please select a member.');
      return;
    }

    setGrantLoading(true);
    try {
      await toggleMemberVip(grantUserId, true);
      showToast('success', 'VIP Pass entitlement granted.');
      setGrantModalOpen(false);
      await loadData();
    } catch (err) {
      console.error('Grant VIP error:', err);
      showToast('error', err.message || 'Failed to grant VIP pass.');
    } finally {
      setGrantLoading(false);
    }
  };

  // Revoke VIP Member
  const handleRevokeVip = (member) => {
    setConfirmTitle('Revoke VIP Membership');
    setConfirmMessage(
      `Are you sure you want to revoke VIP Pass access for "${member.full_name || member.email}"?`
    );
    setConfirmAction(() => async () => {
      setConfirmLoading(true);
      try {
        await toggleMemberVip(member.id, false);
        showToast('success', `VIP Pass revoked for "${member.full_name || member.email}".`);
        setConfirmOpen(false);
        await loadData();
      } catch (err) {
        console.error('Revoke VIP error:', err);
        showToast('error', 'Failed to revoke VIP status.');
      } finally {
        setConfirmLoading(false);
      }
    });
    setConfirmOpen(true);
  };

  // Save VIP Presentation & Access Settings
  const handleSaveSettings = (e) => {
    e.preventDefault();
    saveLocalVipSettings(settingsFormData);
    setVipSettings(settingsFormData);
    setSettingsModalOpen(false);
    showToast('success', 'VIP Pass presentation & access settings updated.');
  };

  // Find currently featured VIP item from contentList
  const featuredItem = useMemo(() => {
    return contentList.find((item) => item.is_featured && item.is_vip);
  }, [contentList]);

  // Candidates for add content modal
  const currentAddCandidates =
    addType === 'spark'
      ? candidates.sparks
      : addType === 'video'
        ? candidates.videos
        : candidates.audios;

  return (
    <div>
      {/* Top Action Header */}
      <div
        className="page-header-row"
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Crown size={22} color="var(--accent-vip)" />
            <h2 className="page-header-title" style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-main)' }}>
              VIP Pass Management
            </h2>
          </div>
          <p className="page-header-subtitle" style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Manage the content, benefits, access rules, and presentation of the VIP experience in the Dr. Cubie mobile app.
          </p>
        </div>

        <div className="page-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={handleOpenCreatePlan}
          >
            Create Plans
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={RefreshCw}
            loading={refreshing}
            onClick={() => loadData(true)}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Dynamic KPI Cards Overview */}
      <div className="kpi-grid">
        <div className="card" style={{ padding: '1.1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>VIP Members</span>
            <Users size={16} color="var(--accent-vip)" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-main)' }}>
            {kpis.vipMembers}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            profiles with is_vip = true
          </div>
        </div>

        <div className="card" style={{ padding: '1.1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>VIP Videos</span>
            <Video size={16} color="var(--primary)" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-main)' }}>
            {kpis.vipVideos}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            exclusive masterclasses
          </div>
        </div>

        <div className="card" style={{ padding: '1.1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>VIP Audios</span>
            <Headphones size={16} color="var(--accent-vip)" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-main)' }}>
            {kpis.vipAudios}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            extended soundscapes
          </div>
        </div>

        <div className="card" style={{ padding: '1.1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>VIP Sparks</span>
            <Sparkles size={16} color="var(--primary)" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-main)' }}>
            {kpis.vipSparks}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            curated wisdom cards
          </div>
        </div>

        <div className="card" style={{ padding: '1.1rem', backgroundColor: 'var(--accent-vip-bg)', borderColor: 'var(--accent-vip-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-vip)' }}>Active VIP Content</span>
            <Crown size={16} color="var(--accent-vip)" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--accent-vip)' }}>
            {kpis.activeVipContent}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--accent-vip)', opacity: 0.85, marginTop: '2px' }}>
            published VIP exclusives
          </div>
        </div>
      </div>

      {/* Membership Plans Management Section */}
      <MembershipPlansSection
        plans={plans}
        loading={plansLoading}
        tableMissing={plansTableMissing}
        onCreatePlan={handleOpenCreatePlan}
        onEditPlan={handleOpenEditPlan}
        onToggleStatus={handleTogglePlanStatus}
        onDeletePlan={handleDeletePlan}
      />

      {/* Main VIP Content Management Section */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div
          className="card-header"
          style={{
            flexWrap: 'wrap',
            gap: '1rem',
            borderBottom: '1px solid var(--border-subtle)',
            paddingBottom: '1rem'
          }}
        >
          <div>
            <h3 className="card-title">VIP Content Catalog</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Manage which Sparks, Videos, and Audios are designated as VIP-only in the Dr. Cubie app
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Button variant="primary" size="sm" icon={Plus} onClick={handleOpenAddContent}>
              Add VIP Content
            </Button>
          </div>
        </div>

        {/* Filters Bar */}
        <div
          style={{
            padding: '1rem',
            backgroundColor: 'var(--bg-muted)',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '0.75rem',
            alignItems: 'center'
          }}
        >
          <div style={{ position: 'relative' }}>
            <Input
              placeholder="Search content or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ marginBottom: 0 }}
            />
          </div>

          <Select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            options={TYPE_OPTIONS}
            style={{ marginBottom: 0 }}
          />

          <Select
            value={selectedVipFilter}
            onChange={(e) => setSelectedVipFilter(e.target.value)}
            options={VIP_FILTER_OPTIONS}
            style={{ marginBottom: 0 }}
          />

          <Select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            options={STATUS_OPTIONS}
            style={{ marginBottom: 0 }}
          />
        </div>

        {/* Content Table / Cards */}
        {loading && !refreshing ? (
          <Spinner size={36} text="Loading VIP Content Catalog..." />
        ) : contentList.length === 0 ? (
          <EmptyState
            icon={Crown}
            title="No VIP Content Found"
            description="There are currently no items matching the selected filters. Use 'Add VIP Content' to designate Sparks, Videos, or Audios as VIP exclusives."
            actionLabel="Add VIP Content"
            onAction={handleOpenAddContent}
          />
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="table-container recommendations-desktop-table" style={{ border: 'none', boxShadow: 'none' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Content Item</th>
                    <th>Type</th>
                    <th>VIP Access Tier</th>
                    <th>Highlight</th>
                    <th>Status</th>
                    <th>Duration</th>
                    <th>Created</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {contentList.map((item) => {
                    let TypeIcon = Sparkles;
                    if (item.content_type === 'video') TypeIcon = Video;
                    if (item.content_type === 'audio') TypeIcon = Headphones;

                    return (
                      <tr key={`${item.content_type}-${item.id}`} style={!item.is_vip ? { opacity: 0.85 } : {}}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            {item.thumbnail_url ? (
                              <img
                                src={item.thumbnail_url}
                                alt={item.title}
                                style={{
                                  width: '42px',
                                  height: '42px',
                                  borderRadius: 'var(--radius-xs)',
                                  objectFit: 'cover'
                                }}
                              />
                            ) : (
                              <div
                                style={{
                                  width: '42px',
                                  height: '42px',
                                  borderRadius: 'var(--radius-xs)',
                                  backgroundColor: 'var(--bg-muted)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: 'var(--text-muted)'
                                }}
                              >
                                <TypeIcon size={18} />
                              </div>
                            )}
                            <div>
                              <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.9rem' }}>
                                {item.title}
                              </div>
                              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                {item.category}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td>
                          <Badge variant="primary" icon={TypeIcon}>
                            {item.content_type.toUpperCase()}
                          </Badge>
                        </td>

                        <td>
                          <button
                            onClick={() => handleToggleContentVip(item)}
                            className={`badge ${item.is_vip ? 'badge-vip' : 'badge-muted'}`}
                            style={{ cursor: 'pointer', border: 'none' }}
                            title="Click to toggle VIP status in Supabase"
                          >
                            <Crown size={12} />
                            <span>{item.is_vip ? 'VIP Exclusive' : 'Public (Free)'}</span>
                          </button>
                        </td>

                        <td>
                          {item.is_vip ? (
                            <button
                              onClick={() => handleSetFeatured(item)}
                              className={`badge ${item.is_featured ? 'badge-warning' : 'badge-muted'}`}
                              style={{ cursor: 'pointer', border: 'none' }}
                              title={item.is_featured ? 'Click to unfeature' : 'Click to feature on VIP Pass screen'}
                            >
                              <Star size={12} />
                              <span>{item.is_featured ? 'Featured Highlight' : 'Standard VIP'}</span>
                            </button>
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>—</span>
                          )}
                        </td>

                        <td>
                          <Badge
                            variant={
                              item.status === 'published'
                                ? 'success'
                                : item.status === 'draft'
                                  ? 'warning'
                                  : 'muted'
                            }
                          >
                            {item.status || 'published'}
                          </Badge>
                        </td>

                        <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                          {item.duration || '—'}
                        </td>

                        <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                          {formatDate(item.created_at)}
                        </td>

                        <td>
                          <div className="table-actions" style={{ justifyContent: 'flex-end' }}>
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={Eye}
                              onClick={() => {
                                setPreviewItem(item);
                                setPreviewOpen(true);
                              }}
                              title="Preview Content"
                            />

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleContentVip(item)}
                              title={item.is_vip ? 'Make Public' : 'Make VIP'}
                              style={{ color: item.is_vip ? 'var(--text-muted)' : 'var(--accent-vip)' }}
                            >
                              {item.is_vip ? 'Make Public' : 'Make VIP'}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="recommendations-mobile-cards" style={{ padding: '1rem' }}>
              {contentList.map((item) => {
                let TypeIcon = Sparkles;
                if (item.content_type === 'video') TypeIcon = Video;
                if (item.content_type === 'audio') TypeIcon = Headphones;

                return (
                  <div
                    key={`mobile-${item.content_type}-${item.id}`}
                    className="rec-mobile-card"
                    style={{
                      borderLeft: item.is_vip ? '3px solid var(--accent-vip)' : '3px solid var(--border-subtle)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Badge variant="primary" icon={TypeIcon}>
                          {item.content_type.toUpperCase()}
                        </Badge>
                        <Badge variant="muted">{item.category}</Badge>
                      </div>
                      <button
                        onClick={() => handleToggleContentVip(item)}
                        className={`badge ${item.is_vip ? 'badge-vip' : 'badge-muted'}`}
                        style={{ cursor: 'pointer', border: 'none' }}
                      >
                        <Crown size={12} />
                        <span>{item.is_vip ? 'VIP' : 'Free'}</span>
                      </button>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                      {item.thumbnail_url && (
                        <img
                          src={item.thumbnail_url}
                          alt={item.title}
                          style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-xs)', objectFit: 'cover' }}
                        />
                      )}
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.92rem' }}>
                          {item.title}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {item.duration || '3 min'} • {item.status || 'published'}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.5rem' }}>
                      {item.is_vip ? (
                        <button
                          onClick={() => handleSetFeatured(item)}
                          className={`badge ${item.is_featured ? 'badge-warning' : 'badge-muted'}`}
                          style={{ cursor: 'pointer', border: 'none' }}
                        >
                          <Star size={12} />
                          <span>{item.is_featured ? 'Featured Highlight' : 'Set Featured'}</span>
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Standard Access</span>
                      )}

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={Eye}
                          onClick={() => {
                            setPreviewItem(item);
                            setPreviewOpen(true);
                          }}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleContentVip(item)}
                          style={{ fontSize: '0.75rem' }}
                        >
                          {item.is_vip ? 'Make Public' : 'Make VIP'}
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* VIP Members Section */}
      <div className="card">
        <div
          className="card-header"
          style={{
            flexWrap: 'wrap',
            gap: '1rem',
            borderBottom: '1px solid var(--border-subtle)',
            paddingBottom: '1rem'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={18} color="var(--accent-vip)" />
              <h3 className="card-title">VIP Member Directory</h3>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Registered accounts in <code>public.profiles</code> with active VIP pass entitlement (<code>is_vip = true</code>)
            </p>
          </div>

          <Button variant="secondary" size="sm" icon={UserCheck} onClick={handleOpenGrantVip}>
            Grant VIP Access
          </Button>
        </div>

        {vipMembers.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No VIP Members Yet"
            description="No users currently hold VIP pass access. Click 'Grant VIP Access' to bestow VIP status to any registered member profile."
            actionLabel="Grant VIP Access"
            onAction={handleOpenGrantVip}
          />
        ) : (
          <>
            <div className="table-container users-desktop-table" style={{ border: 'none', boxShadow: 'none' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Member Name</th>
                    <th>Email</th>
                    <th>VIP Status</th>
                    <th>Role</th>
                    <th>Member Since</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {vipMembers.map((member) => (
                    <tr key={member.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div
                            className="user-avatar-circle"
                            style={{ width: '32px', height: '32px', fontSize: '0.85rem' }}
                          >
                            {member.avatar_url ? (
                              <img src={member.avatar_url} alt={member.full_name || 'Member'} />
                            ) : (
                              (member.full_name || member.email || 'U').charAt(0).toUpperCase()
                            )}
                          </div>
                          <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.9rem' }}>
                            {member.full_name || 'Anonymous User'}
                          </div>
                        </div>
                      </td>

                      <td>
                        <code style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                          {member.email}
                        </code>
                      </td>

                      <td>
                        <Badge variant="vip" icon={Crown}>
                          VIP ACTIVE
                        </Badge>
                      </td>

                      <td>
                        <Badge variant={member.role === 'admin' ? 'primary' : 'muted'}>
                          {member.role?.toUpperCase() || 'USER'}
                        </Badge>
                      </td>

                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {formatDate(member.created_at)}
                      </td>

                      <td>
                        <div className="table-actions" style={{ justifyContent: 'flex-end' }}>
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={UserX}
                            onClick={() => handleRevokeVip(member)}
                            style={{ color: 'var(--danger)' }}
                            title="Revoke VIP Access"
                          >
                            Revoke VIP
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards for VIP Members */}
            <div className="users-mobile-cards" style={{ padding: '0.5rem 0' }}>
              {vipMembers.map((member) => (
                <div key={`m-vip-${member.id}`} className="admin-mobile-card user-mobile-card">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.4rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <div className="user-avatar-circle" style={{ width: '32px', height: '32px', fontSize: '0.85rem' }}>
                        {member.avatar_url ? (
                          <img src={member.avatar_url} alt={member.full_name || 'Member'} />
                        ) : (
                          (member.full_name || member.email || 'U').charAt(0).toUpperCase()
                        )}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.92rem' }}>
                          {member.full_name || 'Anonymous User'}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                          Joined {formatDate(member.created_at)}
                        </div>
                      </div>
                    </div>
                    <Badge variant="vip" icon={Crown}>VIP ACTIVE</Badge>
                  </div>

                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', wordBreak: 'break-all' }}>
                    <code>{member.email}</code>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.5rem' }}>
                    <Badge variant={member.role === 'admin' ? 'primary' : 'muted'}>
                      {member.role?.toUpperCase() || 'USER'}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={UserX}
                      onClick={() => handleRevokeVip(member)}
                      style={{ color: 'var(--danger)', minHeight: '36px' }}
                    >
                      Revoke VIP
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Modal: Add Content to VIP */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Add Content to VIP Pass"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setAddModalOpen(false)} disabled={addLoading}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSaveAddContent}
              loading={addLoading}
              disabled={currentAddCandidates.length === 0}
            >
              Add to VIP Pass
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveAddContent}>
          {/* Content Type Tabs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <button
              type="button"
              className={`btn ${addType === 'spark' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => {
                setAddType('spark');
                setAddContentId(candidates.sparks[0]?.id || '');
              }}
            >
              <Sparkles size={16} />
              <span>Spark</span>
            </button>
            <button
              type="button"
              className={`btn ${addType === 'video' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => {
                setAddType('video');
                setAddContentId(candidates.videos[0]?.id || '');
              }}
            >
              <Video size={16} />
              <span>Video</span>
            </button>
            <button
              type="button"
              className={`btn ${addType === 'audio' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => {
                setAddType('audio');
                setAddContentId(candidates.audios[0]?.id || '');
              }}
            >
              <Headphones size={16} />
              <span>Audio</span>
            </button>
          </div>

          {currentAddCandidates.length === 0 ? (
            <div
              style={{
                padding: '1.5rem',
                backgroundColor: 'var(--bg-muted)',
                borderRadius: 'var(--radius-sm)',
                textAlign: 'center'
              }}
            >
              <AlertCircle size={24} color="var(--warning)" style={{ margin: '0 auto 0.5rem' }} />
              <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.92rem' }}>
                All existing {addType}s are already marked as VIP!
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                To create new content, use the dedicated Sparks, Videos, or Audios management module.
              </p>
            </div>
          ) : (
            <>
              <Select
                label={`Select Existing ${addType.toUpperCase()} from Supabase`}
                name="content_id"
                value={addContentId}
                onChange={(e) => setAddContentId(e.target.value)}
                options={currentAddCandidates.map((c) => ({
                  value: c.id,
                  label: `${c.title} (${c.category || 'General'})`
                }))}
                required
                helperText="Sets is_vip = true on this existing item. Does not upload duplicate files."
              />

              <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  id="make_featured"
                  checked={makeFeaturedOnAdd}
                  onChange={(e) => setMakeFeaturedOnAdd(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: 'var(--accent-vip)', cursor: 'pointer' }}
                />
                <label htmlFor="make_featured" style={{ fontSize: '0.88rem', fontWeight: 600, cursor: 'pointer' }}>
                  Set as Featured VIP Highlight on mobile screen
                </label>
              </div>
            </>
          )}
        </form>
      </Modal>

      {/* Modal: Grant VIP to Member */}
      <Modal
        isOpen={grantModalOpen}
        onClose={() => setGrantModalOpen(false)}
        title="Grant VIP Pass to Registered Member"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setGrantModalOpen(false)} disabled={grantLoading}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSaveGrantVip}
              loading={grantLoading}
              disabled={standardMembers.length === 0}
            >
              Grant VIP Entitlement
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveGrantVip}>
          {standardMembers.length === 0 ? (
            <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              No non-VIP members available. All registered accounts already have VIP access!
            </div>
          ) : (
            <Select
              label="Select Registered Member Profile"
              name="user_id"
              value={grantUserId}
              onChange={(e) => setGrantUserId(e.target.value)}
              options={standardMembers.map((u) => ({
                value: u.id,
                label: `${u.full_name || 'Anonymous User'} (${u.email})`
              }))}
              required
              helperText="Updates profiles.is_vip = true in Supabase. Passwords or credentials remain untouched."
            />
          )}
        </form>
      </Modal>

      {/* Modal: VIP Presentation & Access Configuration */}
      <Modal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        title="Configure VIP Pass Presentation"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setSettingsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveSettings}>
              Save Presentation
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Input
            label="VIP Plan Title"
            value={settingsFormData.vip_title}
            onChange={(e) => setSettingsFormData({ ...settingsFormData, vip_title: e.target.value })}
            placeholder="VIP Sanctuary Pass"
            required
          />

          <Input
            label="Editorial Subtitle / Tagline"
            value={settingsFormData.vip_subtitle}
            onChange={(e) => setSettingsFormData({ ...settingsFormData, vip_subtitle: e.target.value })}
            placeholder="Elevate Your Daily Practice"
            required
          />

          <Input
            label="Cohort Badge Label"
            value={settingsFormData.vip_cohort}
            onChange={(e) => setSettingsFormData({ ...settingsFormData, vip_cohort: e.target.value })}
            placeholder="Annual Cohort"
          />

          <div className="input-group">
            <label className="input-label">VIP Access Message / Pitch</label>
            <textarea
              className="input-field"
              rows={3}
              value={settingsFormData.vip_message}
              onChange={(e) => setSettingsFormData({ ...settingsFormData, vip_message: e.target.value })}
              style={{ width: '100%', resize: 'vertical' }}
              placeholder="Unrestricted access to Dr. Cubie's private audio archives..."
            />
          </div>

          <Select
            label="Content Visibility for Non-VIP Users"
            value={settingsFormData.content_visibility}
            onChange={(e) => setSettingsFormData({ ...settingsFormData, content_visibility: e.target.value })}
            options={[
              { value: 'locked', label: 'Locked with VIP Badge (Teaser)' },
              { value: 'hidden', label: 'Hidden until VIP Subscribed' }
            ]}
          />
        </form>
      </Modal>

      {/* Media Preview Modal */}
      <MediaPreviewModal
        isOpen={previewOpen}
        onClose={() => {
          setPreviewOpen(false);
          setPreviewItem(null);
        }}
        item={previewItem}
        type={previewItem?.content_type || 'spark'}
      />

      {/* Plan Form Modal (Create / Edit) */}
      <PlanFormModal
        isOpen={planModalOpen}
        onClose={() => {
          setPlanModalOpen(false);
          setEditingPlan(null);
        }}
        onSave={handleSavePlan}
        initialData={editingPlan}
        loading={planSaving}
      />

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={confirmAction}
        title={confirmTitle}
        message={confirmMessage}
        confirmLabel="Confirm"
        loading={confirmLoading}
      />
    </div>
  );
};

export default VipPassPage;
