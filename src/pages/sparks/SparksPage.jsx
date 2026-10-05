import React, { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Edit2,
  Trash2,
  Eye,
  Video,
  Headphones,
  Crown,
  CheckCircle2,
  Clock,
  ExternalLink
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Pagination from '../../components/ui/Pagination';
import usePagination from '../../hooks/usePagination';
import SparkFormModal from '../../components/content/SparkFormModal';
import MediaPreviewModal from '../../components/content/MediaPreviewModal';
import {
  fetchAdminSparks,
  createSpark,
  updateSpark,
  deleteSpark,
  createSparkWithMedia,
  updateSparkWithMedia
} from '../../services/sparks/sparksAdminService';
import { useToast } from '../../context/ToastContext';
import { formatDate } from '../../utils/formatters';

const CATEGORY_OPTIONS = [
  { value: '', label: 'All Categories' },
  { value: 'Mindfulness', label: 'Mindfulness' },
  { value: 'Focus', label: 'Focus' },
  { value: 'Confidence', label: 'Confidence' },
  { value: 'Reflection', label: 'Reflection' },
  { value: 'Clarity', label: 'Clarity' },
  { value: 'Resilience', label: 'Resilience' }
];

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Draft' },
  { value: 'archived', label: 'Archived' }
];

const VIP_OPTIONS = [
  { value: '', label: 'All Access' },
  { value: 'true', label: 'VIP Only' },
  { value: 'false', label: 'Standard (Free)' }
];

export const SparksPage = () => {
  const [sparks, setSparks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [isVip, setIsVip] = useState('');

  // Modals state
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingSpark, setEditingSpark] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewSpark, setPreviewSpark] = useState(null);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [sparkToDelete, setSparkToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const { showToast } = useToast();

  const {
    currentPage,
    setCurrentPage,
    totalPages,
    pageSize,
    totalItems,
    paginatedItems: paginatedSparks
  } = usePagination(sparks, 10, [search, category, status, isVip]);

  const loadSparks = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await fetchAdminSparks({
        search,
        category,
        status,
        isVip,
        limit: 500
      });
      setSparks(data || []);
      if (isRefresh) {
        showToast('success', 'Sparks list refreshed from database.');
      }
    } catch (err) {
      console.error('[SparksPage] Error loading sparks:', err);
      showToast('error', 'Failed to load sparks from database.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, category, status, isVip, showToast]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadSparks();
    }, 250);
    return () => clearTimeout(timer);
  }, [loadSparks]);

  const handleOpenCreate = () => {
    setEditingSpark(null);
    setFormModalOpen(true);
  };

  const handleOpenEdit = (spark) => {
    setEditingSpark(spark);
    setFormModalOpen(true);
  };

  const handleOpenPreview = (spark) => {
    setPreviewSpark(spark);
    setPreviewModalOpen(true);
  };

  const handleOpenDelete = (spark) => {
    setSparkToDelete(spark);
    setDeleteConfirmOpen(true);
  };

  const handleSaveSpark = async (formData) => {
    setFormLoading(true);
    try {
      if (editingSpark) {
        await updateSparkWithMedia(editingSpark.id, formData, editingSpark);
        showToast('success', `Spark "${formData.title}" updated successfully.`);
      } else {
        await createSparkWithMedia(formData);
        showToast('success', `Spark "${formData.title}" created successfully.`);
      }
      setFormModalOpen(false);
      loadSparks();
    } catch (err) {
      console.error('[SparksPage] Error saving spark:', err);
      showToast('error', err.message || 'Failed to save spark.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!sparkToDelete) return;
    setDeleteLoading(true);
    try {
      await deleteSpark(sparkToDelete.id);
      showToast('success', `Spark "${sparkToDelete.title}" removed.`);
      setDeleteConfirmOpen(false);
      setSparkToDelete(null);
      loadSparks();
    } catch (err) {
      console.error('[SparksPage] Error deleting spark:', err);
      showToast('error', err.message || 'Failed to delete spark.');
    } finally {
      setDeleteLoading(false);
    }
  };

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
            Daily Sparks Management
          </h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Curate reflection cards, audio-video connections, and actionable practices
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Button
            variant="secondary"
            size="sm"
            icon={RefreshCw}
            loading={refreshing}
            onClick={() => loadSparks(true)}
          >
            Refresh
          </Button>

          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={handleOpenCreate}
          >
            Create Spark
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="toolbar-bar">
        <div className="toolbar-search">
          <Search size={16} className="toolbar-search-icon" />
          <input
            type="text"
            className="form-input toolbar-search-input"
            placeholder="Search by title or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="toolbar-actions">
          <Select
            options={CATEGORY_OPTIONS}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={{ width: '160px', marginBottom: 0 }}
          />

          <Select
            options={STATUS_OPTIONS}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            style={{ width: '140px', marginBottom: 0 }}
          />

          <Select
            options={VIP_OPTIONS}
            value={isVip}
            onChange={(e) => setIsVip(e.target.value)}
            style={{ width: '140px', marginBottom: 0 }}
          />
        </div>
      </div>

      {/* Main Content Table or Empty State */}
      {loading && !refreshing ? (
        <Spinner size={36} text="Loading Sparks catalog..." />
      ) : sparks.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Sparkles}
            title="No Sparks found"
            description={
              search || category || status || isVip
                ? 'Try adjusting your search filters to find matching sparks.'
                : 'Create your first wisdom spark to inspire Dr. Cubie members.'
            }
            actionLabel="Create New Spark"
            onAction={handleOpenCreate}
          />
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {/* Desktop Table View */}
          <div className="table-container sparks-desktop-table" style={{ border: 'none', boxShadow: 'none' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: '56px' }}>Media</th>
                  <th>Spark Title</th>
                  <th>Category</th>
                  <th>Duration</th>
                  <th>Linked Assets</th>
                  <th>Status</th>
                  <th>Access</th>
                  <th>Created</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedSparks.map((spark) => (
                  <tr key={spark.id}>
                    <td>
                      {spark.thumbnail_url ? (
                        <img
                          src={spark.thumbnail_url}
                          alt={spark.title}
                          className="table-thumbnail"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div
                          className="table-thumbnail"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: 'var(--primary-light)',
                            color: 'var(--primary)'
                          }}
                        >
                          <Sparkles size={18} />
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.9rem' }}>
                        {spark.title}
                      </div>
                      {spark.short_description && (
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px', maxWidth: '300px' }}>
                          {spark.short_description}
                        </div>
                      )}
                    </td>
                    <td>
                      <Badge variant="primary">{spark.category || 'Mindfulness'}</Badge>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {spark.duration || '4 min'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                        {(spark.video_id || spark.videos?.video_url) && (
                          <span
                            title={spark.videos?.title ? `Video: ${spark.videos.title}` : 'Video Linked'}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '2px',
                              fontSize: '0.72rem',
                              color: '#0284c7',
                              backgroundColor: '#e0f2fe',
                              padding: '2px 6px',
                              borderRadius: '4px'
                            }}
                          >
                            <Video size={12} />
                            Video
                          </span>
                        )}
                        {(spark.audio_id || spark.audios?.audio_url) && (
                          <span
                            title={spark.audios?.title ? `Audio: ${spark.audios.title}` : 'Audio Linked'}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '2px',
                              fontSize: '0.72rem',
                              color: '#059669',
                              backgroundColor: '#ecfdf5',
                              padding: '2px 6px',
                              borderRadius: '4px'
                            }}
                          >
                            <Headphones size={12} />
                            Audio
                          </span>
                        )}
                        {!spark.video_id && !spark.audio_id && !spark.videos?.video_url && !spark.audios?.audio_url && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-faint)' }}>None</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <Badge
                        variant={
                          spark.status === 'published'
                            ? 'success'
                            : spark.status === 'draft'
                              ? 'warning'
                              : 'muted'
                        }
                      >
                        {spark.status || 'published'}
                      </Badge>
                    </td>
                    <td>
                      {spark.is_vip ? (
                        <Badge variant="vip" icon={Crown}>
                          VIP
                        </Badge>
                      ) : (
                        <Badge variant="muted">All Users</Badge>
                      )}
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {formatDate(spark.created_at)}
                    </td>
                    <td>
                      <div className="table-actions" style={{ justifyContent: 'flex-end' }}>
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={Eye}
                          onClick={() => handleOpenPreview(spark)}
                          title="Preview Spark"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={Edit2}
                          onClick={() => handleOpenEdit(spark)}
                          title="Edit Spark"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={Trash2}
                          onClick={() => handleOpenDelete(spark)}
                          style={{ color: 'var(--danger)' }}
                          title="Delete Spark"
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View (Fluid on 320px - 768px viewports) */}
          <div className="sparks-mobile-cards" style={{ padding: '0.85rem' }}>
            {paginatedSparks.map((spark) => (
              <div key={spark.id} className="spark-mobile-card">
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                  {spark.thumbnail_url ? (
                    <img
                      src={spark.thumbnail_url}
                      alt={spark.title}
                      style={{
                        width: '54px',
                        height: '54px',
                        borderRadius: 'var(--radius-sm)',
                        objectFit: 'cover',
                        flexShrink: 0
                      }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '54px',
                        height: '54px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'var(--primary-light)',
                        color: 'var(--primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      <Sparkles size={20} />
                    </div>
                  )}

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
                      <Badge variant="primary" style={{ padding: '1px 6px', fontSize: '0.68rem' }}>
                        {spark.category || 'Mindfulness'}
                      </Badge>
                      <Badge
                        variant={spark.status === 'published' ? 'success' : spark.status === 'draft' ? 'warning' : 'muted'}
                        style={{ padding: '1px 6px', fontSize: '0.68rem' }}
                      >
                        {spark.status || 'published'}
                      </Badge>
                      {spark.is_vip && (
                        <Badge variant="vip" icon={Crown} style={{ padding: '1px 6px', fontSize: '0.68rem' }}>
                          VIP
                        </Badge>
                      )}
                    </div>

                    <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 0.25rem 0' }}>
                      {spark.title}
                    </h4>

                    {spark.short_description && (
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '0 0 0.5rem 0', lineHeight: 1.35 }}>
                        {spark.short_description}
                      </p>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      <span>{spark.duration || '4 min'}</span>
                      <span>•</span>
                      {(spark.video_id || spark.videos?.video_url) && (
                        <span style={{ color: '#0284c7', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                          <Video size={11} /> Video
                        </span>
                      )}
                      {(spark.audio_id || spark.audios?.audio_url) && (
                        <span style={{ color: '#059669', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                          <Headphones size={11} /> Audio
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Mobile Card Action Bar */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: '0.75rem',
                    paddingTop: '0.65rem',
                    borderTop: '1px solid var(--border-subtle)'
                  }}
                >
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {formatDate(spark.created_at)}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={Eye}
                      onClick={() => handleOpenPreview(spark)}
                      title="Preview Spark"
                      style={{ padding: '0.35rem 0.55rem' }}
                    >
                      Preview
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={Edit2}
                      onClick={() => handleOpenEdit(spark)}
                      title="Edit Spark"
                      style={{ padding: '0.35rem 0.65rem' }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={Trash2}
                      onClick={() => handleOpenDelete(spark)}
                      style={{ padding: '0.35rem 0.55rem', color: 'var(--danger)' }}
                      title="Delete Spark"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {/* Spark Create / Edit Modal */}
      <SparkFormModal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        onSave={handleSaveSpark}
        initialData={editingSpark}
        loading={formLoading}
      />

      {/* Preview Modal */}
      <MediaPreviewModal
        isOpen={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        item={previewSpark}
        type="spark"
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setSparkToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Spark"
        message={`Are you sure you want to delete "${sparkToDelete?.title}"?`}
        warningNote="If this Spark is scheduled on the Today screen or linked in recommendations, it may affect consumer app users."
        confirmLabel="Delete Spark"
        loading={deleteLoading}
      />
    </div>
  );
};

export default SparksPage;