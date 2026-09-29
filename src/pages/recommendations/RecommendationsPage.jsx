import React, { useState, useEffect, useCallback } from 'react';
import {
  Compass,
  Plus,
  RefreshCw,
  Edit2,
  Trash2,
  Sparkles,
  Video,
  Headphones,
  CheckCircle2,
  XCircle,
  ArrowUpDown
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Modal from '../../components/ui/Modal';
import {
  fetchAdminRecommendations,
  fetchRecommendationCandidates,
  createRecommendation,
  updateRecommendation,
  toggleRecommendationActive,
  deleteRecommendation
} from '../../services/recommendations/recommendationsAdminService';
import { useToast } from '../../context/ToastContext';
import { formatDate } from '../../utils/formatters';

const CATEGORY_OPTIONS = [
  { value: 'Mindfulness', label: 'Mindfulness' },
  { value: 'Focus', label: 'Focus' },
  { value: 'Confidence', label: 'Confidence' },
  { value: 'Reflection', label: 'Reflection' },
  { value: 'Clarity', label: 'Clarity' },
  { value: 'Resilience', label: 'Resilience' }
];

export const RecommendationsPage = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [candidates, setCandidates] = useState({ sparks: [], videos: [], audios: [] });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Form modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    content_type: 'spark',
    content_id: '',
    category: 'Mindfulness',
    target_position: 'last',
    is_active: true
  });

  // Delete dialog
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const { showToast } = useToast();

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [recs, cand] = await Promise.all([
        fetchAdminRecommendations(),
        fetchRecommendationCandidates()
      ]);
      setRecommendations(recs || []);
      setCandidates(cand);
      if (isRefresh) {
        showToast('success', 'Recommendations synchronized.');
      }
    } catch (err) {
      console.error('[RecommendationsPage] Error:', err);
      showToast('error', 'Failed to load recommendations.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const activeRecommendations = recommendations.filter((r) => r.is_active);
  const activeCount = activeRecommendations.length;

  const getPositionOptions = () => {
    const isEdit = Boolean(editingItem);
    const wasActive = Boolean(editingItem?.is_active);
    const slots = isEdit && wasActive ? Math.max(1, activeCount) : activeCount + 1;

    const ordinals = [
      '',
      'First',
      'Second',
      'Third',
      'Fourth',
      'Fifth',
      'Sixth',
      'Seventh',
      'Eighth',
      'Ninth',
      'Tenth'
    ];

    const options = [];
    for (let p = 1; p <= slots; p++) {
      const ord = ordinals[p] || `Position ${p}`;
      let label = `${p} — ${ord}`;

      if (p === slots && slots > 1) {
        label = `${p} — ${ord} (Last)`;
      }

      if (isEdit && wasActive) {
        const itemIdx = activeRecommendations.findIndex((item) => item.id === editingItem.id);
        if (itemIdx + 1 === p) {
          label += ' (Current)';
        }
      }

      options.push({
        value: String(p),
        label
      });
    }

    return options;
  };

  const handleOpenCreate = () => {
    setEditingItem(null);
    const nextSlot = activeCount + 1;
    setFormData({
      title: '',
      content_type: 'spark',
      content_id: candidates.sparks[0]?.id || '',
      category: 'Mindfulness',
      target_position: String(nextSlot),
      is_active: true
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (rec) => {
    setEditingItem(rec);
    let currentPos = String(activeCount + 1);
    if (rec.is_active) {
      const idx = activeRecommendations.findIndex((item) => item.id === rec.id);
      currentPos = idx !== -1 ? String(idx + 1) : String(rec.display_order || 1);
    }
    setFormData({
      title: rec.title || '',
      content_type: rec.content_type || 'spark',
      content_id: rec.content_id || '',
      category: rec.category || 'Mindfulness',
      target_position: currentPos,
      is_active: Boolean(rec.is_active)
    });
    setModalOpen(true);
  };

  const handleContentTypeChange = (newType) => {
    let defaultId = '';
    if (newType === 'spark') defaultId = candidates.sparks[0]?.id || '';
    if (newType === 'video') defaultId = candidates.videos[0]?.id || '';
    if (newType === 'audio') defaultId = candidates.audios[0]?.id || '';

    setFormData((prev) => ({
      ...prev,
      content_type: newType,
      content_id: defaultId
    }));
  };

  const handleCandidateSelection = (contentId) => {
    const list =
      formData.content_type === 'spark'
        ? candidates.sparks
        : formData.content_type === 'video'
        ? candidates.videos
        : candidates.audios;

    const selected = list.find((item) => item.id === contentId);
    setFormData((prev) => ({
      ...prev,
      content_id: contentId,
      title: prev.title ? prev.title : selected?.title || ''
    }));
  };

  const handleToggleActive = async (rec) => {
    try {
      await toggleRecommendationActive(rec.id, !rec.is_active);
      showToast(
        'success',
        `Recommendation "${rec.title}" is now ${!rec.is_active ? 'active' : 'inactive'}.`
      );
      await loadData();
    } catch (err) {
      console.error('Toggle error:', err);
      showToast('error', 'Failed to toggle status.');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content_id) {
      showToast('error', 'Title and linked content item are required.');
      return;
    }

    setFormLoading(true);
    try {
      if (editingItem) {
        await updateRecommendation(editingItem.id, formData, formData.target_position);
        showToast('success', 'Recommendation updated.');
      } else {
        await createRecommendation(formData, formData.target_position);
        showToast('success', 'Recommendation added at selected position.');
      }
      setModalOpen(false);
      await loadData();
    } catch (err) {
      console.error('Save recommendation error:', err);
      showToast('error', err.message || 'Failed to save recommendation.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    setDeleteLoading(true);
    try {
      await deleteRecommendation(itemToDelete.id);
      showToast('success', 'Recommendation removed and order normalized.');
      setDeleteOpen(false);
      setItemToDelete(null);
      await loadData();
    } catch (err) {
      console.error('Delete recommendation error:', err);
      showToast('error', err.message || 'Failed to delete recommendation.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const currentCandidates =
    formData.content_type === 'spark'
      ? candidates.sparks
      : formData.content_type === 'video'
      ? candidates.videos
      : candidates.audios;

  return (
    <div>
      {/* Top Action Header */}
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
            Curated Recommendations Feed
          </h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Manage the "Recommended For You" horizontal cards featured in the Dr. Cubie app
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Button
            variant="secondary"
            size="sm"
            icon={RefreshCw}
            loading={refreshing}
            onClick={() => loadData(true)}
          >
            Refresh
          </Button>

          <Button variant="primary" size="sm" icon={Plus} onClick={handleOpenCreate}>
            Add Recommendation
          </Button>
        </div>
      </div>

      {/* Content Table & Mobile Cards */}
      {loading && !refreshing ? (
        <Spinner size={36} text="Loading Recommendations..." />
      ) : recommendations.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Compass}
            title="No recommendations configured"
            description="Add Sparks, Videos, or Audios to recommend tailored contemplation journeys to users."
            actionLabel="Add Recommendation"
            onAction={handleOpenCreate}
          />
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="table-container recommendations-desktop-table">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: '80px' }}>Order</th>
                  <th>Type</th>
                  <th>Display Title</th>
                  <th>Category</th>
                  <th>Linked Content ID</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {recommendations.map((rec) => {
                  let TypeIcon = Sparkles;
                  if (rec.content_type === 'video') {
                    TypeIcon = Video;
                  } else if (rec.content_type === 'audio') {
                    TypeIcon = Headphones;
                  }

                  return (
                    <tr key={rec.id} style={!rec.is_active ? { opacity: 0.75 } : {}}>
                      <td>
                        {rec.is_active ? (
                          <span
                            style={{
                              fontWeight: 700,
                              fontSize: '0.88rem',
                              color: 'var(--primary)',
                              backgroundColor: 'rgba(59, 130, 246, 0.1)',
                              padding: '3px 8px',
                              borderRadius: 'var(--radius-xs)',
                              display: 'inline-block',
                              minWidth: '28px',
                              textAlign: 'center'
                            }}
                          >
                            #{rec.display_order}
                          </span>
                        ) : (
                          <span
                            style={{
                              fontSize: '0.8rem',
                              color: 'var(--text-muted)',
                              backgroundColor: 'var(--bg-muted)',
                              padding: '3px 8px',
                              borderRadius: 'var(--radius-xs)',
                              display: 'inline-block'
                            }}
                            title="Inactive recommendations do not appear in user app"
                          >
                            —
                          </span>
                        )}
                      </td>
                      <td>
                        <Badge variant="primary" icon={TypeIcon}>
                          {rec.content_type?.toUpperCase()}
                        </Badge>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.9rem' }}>
                          {rec.title}
                        </div>
                      </td>
                      <td>
                        <Badge variant="muted">{rec.category || 'Mindfulness'}</Badge>
                      </td>
                      <td>
                        <code style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {rec.content_id}
                        </code>
                      </td>
                      <td>
                        <button
                          onClick={() => handleToggleActive(rec)}
                          className={`badge ${rec.is_active ? 'badge-success' : 'badge-muted'}`}
                          style={{ cursor: 'pointer', border: 'none' }}
                          title="Click to toggle active status"
                        >
                          {rec.is_active ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                          <span>{rec.is_active ? 'Active' : 'Inactive'}</span>
                        </button>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {formatDate(rec.created_at)}
                      </td>
                      <td>
                        <div className="table-actions" style={{ justifyContent: 'flex-end' }}>
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={Edit2}
                            onClick={() => handleOpenEdit(rec)}
                            title="Edit"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={Trash2}
                            onClick={() => {
                              setItemToDelete(rec);
                              setDeleteOpen(true);
                            }}
                            style={{ color: 'var(--danger)' }}
                            title="Delete"
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Responsive Mobile Cards */}
          <div className="recommendations-mobile-cards">
            {recommendations.map((rec) => {
              let TypeIcon = Sparkles;
              if (rec.content_type === 'video') TypeIcon = Video;
              else if (rec.content_type === 'audio') TypeIcon = Headphones;

              return (
                <div key={rec.id} className="rec-mobile-card" style={!rec.is_active ? { opacity: 0.8 } : {}}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {rec.is_active ? (
                        <span
                          style={{
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            color: 'var(--primary)',
                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                            padding: '2px 8px',
                            borderRadius: '4px'
                          }}
                        >
                          #{rec.display_order}
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          Inactive
                        </span>
                      )}
                      <Badge variant="primary" icon={TypeIcon}>
                        {rec.content_type?.toUpperCase()}
                      </Badge>
                    </div>

                    <button
                      onClick={() => handleToggleActive(rec)}
                      className={`badge ${rec.is_active ? 'badge-success' : 'badge-muted'}`}
                      style={{ cursor: 'pointer', border: 'none' }}
                    >
                      {rec.is_active ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                      <span>{rec.is_active ? 'Active' : 'Inactive'}</span>
                    </button>
                  </div>

                  <div style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                    {rec.title}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                    <Badge variant="muted">{rec.category || 'Mindfulness'}</Badge>

                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={Edit2}
                        onClick={() => handleOpenEdit(rec)}
                        title="Edit"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={Trash2}
                        onClick={() => {
                          setItemToDelete(rec);
                          setDeleteOpen(true);
                        }}
                        style={{ color: 'var(--danger)' }}
                        title="Delete"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingItem ? 'Edit Recommendation' : 'Add Recommendation'}
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)} disabled={formLoading}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSave} loading={formLoading}>
              {editingItem ? 'Save Changes' : 'Add Recommendation'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSave}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <button
              type="button"
              className={`btn ${formData.content_type === 'spark' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => handleContentTypeChange('spark')}
            >
              <Sparkles size={16} />
              <span>Spark</span>
            </button>
            <button
              type="button"
              className={`btn ${formData.content_type === 'video' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => handleContentTypeChange('video')}
            >
              <Video size={16} />
              <span>Video</span>
            </button>
            <button
              type="button"
              className={`btn ${formData.content_type === 'audio' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => handleContentTypeChange('audio')}
            >
              <Headphones size={16} />
              <span>Audio</span>
            </button>
          </div>

          <Select
            label={`Select Linked ${formData.content_type.toUpperCase()}`}
            name="content_id"
            value={formData.content_id}
            onChange={(e) => handleCandidateSelection(e.target.value)}
            options={currentCandidates.map((c) => ({
              value: c.id,
              label: `${c.title} (${c.category || 'General'})`
            }))}
            required
            helperText="Choose the content entity that launches when users tap this card"
          />

          <Input
            label="Display Title in Recommendations Feed"
            name="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g. Master the Evening Wind-Down"
            required
          />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <Select
              label="Category"
              name="category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              options={CATEGORY_OPTIONS}
            />

            <Select
              label="Display Position"
              name="target_position"
              value={formData.target_position}
              onChange={(e) => setFormData({ ...formData, target_position: e.target.value })}
              options={getPositionOptions()}
              disabled={!formData.is_active}
              helperText={
                formData.is_active
                  ? 'Sequence in user app carousel (1 = First)'
                  : 'Inactive items do not appear in the active sequence'
              }
            />
          </div>

          <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              style={{ width: '16px', height: '16px', accentColor: 'var(--primary)', cursor: 'pointer' }}
            />
            <label htmlFor="is_active" style={{ fontSize: '0.88rem', fontWeight: 600, cursor: 'pointer' }}>
              Active (Visible immediately in mobile app)
            </label>
          </div>
        </form>
      </Modal>

      {/* Delete confirmation */}
      <ConfirmDialog
        isOpen={deleteOpen}
        onClose={() => {
          setDeleteOpen(false);
          setItemToDelete(null);
        }}
        onConfirm={handleDelete}
        title="Delete Recommendation"
        message={`Are you sure you want to remove recommendation "${itemToDelete?.title}"?`}
        confirmLabel="Remove"
        loading={deleteLoading}
      />
    </div>
  );
};

export default RecommendationsPage;
