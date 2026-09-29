import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Textarea from '../ui/Textarea';
import Button from '../ui/Button';
import MediaUploadField from './MediaUploadField';

const CATEGORY_OPTIONS = [
  { value: 'Mindfulness', label: 'Mindfulness' },
  { value: 'Focus', label: 'Focus' },
  { value: 'Confidence', label: 'Confidence' },
  { value: 'Reflection', label: 'Reflection' },
  { value: 'Clarity', label: 'Clarity' },
  { value: 'Resilience', label: 'Resilience' }
];

// Requirement 7: Exactly 3 publication statuses
const STATUS_OPTIONS = [
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Draft' },
  { value: 'archived', label: 'Archived' }
];

export const SparkFormModal = ({
  isOpen,
  onClose,
  onSave,
  initialData = null,
  loading = false
}) => {
  const [formData, setFormData] = useState({
    title: '',
    short_description: '',
    category: 'Mindfulness',
    duration: '4 min',
    thumbnail_url: '',
    video_url: '',
    video_id: '',
    video_duration: '',
    video_duration_seconds: 0,
    audio_url: '',
    audio_id: '',
    audio_duration: '',
    audio_duration_seconds: 0,
    reflection: '',
    insight: '',
    practice: '',
    status: 'published',
    is_vip: false,
    replacedOldThumbnailPath: null,
    replacedOldVideoPath: null,
    replacedOldAudioPath: null
  });

  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          title: initialData.title || '',
          short_description: initialData.short_description || '',
          category: initialData.category || 'Mindfulness',
          duration: initialData.duration || '4 min',
          thumbnail_url: initialData.thumbnail_url || '',
          video_url: initialData.videos?.video_url || '',
          video_id: initialData.video_id || '',
          video_duration: initialData.videos?.duration || '',
          video_duration_seconds: initialData.videos?.duration_seconds || 0,
          audio_url: initialData.audios?.audio_url || '',
          audio_id: initialData.audio_id || '',
          audio_duration: initialData.audios?.duration || '',
          audio_duration_seconds: initialData.audios?.duration_seconds || 0,
          reflection: initialData.reflection || '',
          insight: initialData.insight || '',
          practice: initialData.practice || '',
          status: initialData.status || 'published',
          is_vip: Boolean(initialData.is_vip),
          replacedOldThumbnailPath: null,
          replacedOldVideoPath: null,
          replacedOldAudioPath: null
        });
      } else {
        setFormData({
          title: '',
          short_description: '',
          category: 'Mindfulness',
          duration: '4 min',
          thumbnail_url: '',
          video_url: '',
          video_id: '',
          video_duration: '',
          video_duration_seconds: 0,
          audio_url: '',
          audio_id: '',
          audio_duration: '',
          audio_duration_seconds: 0,
          reflection: '',
          insight: '',
          practice: '',
          status: 'published',
          is_vip: false,
          replacedOldThumbnailPath: null,
          replacedOldVideoPath: null,
          replacedOldAudioPath: null
        });
      }
      setErrors({});
      setIsUploadingMedia(false);
    }
  }, [isOpen, initialData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;

    setFormData((prev) => ({
      ...prev,
      [name]: val
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  // Media upload handlers
  const handleThumbnailChange = (uploadResult) => {
    if (!uploadResult) {
      setFormData((prev) => ({
        ...prev,
        thumbnail_url: '',
        replacedOldThumbnailPath: prev.thumbnail_url || null
      }));
      return;
    }
    setFormData((prev) => ({
      ...prev,
      thumbnail_url: uploadResult.url,
      replacedOldThumbnailPath: uploadResult.replacedOldPath || prev.replacedOldThumbnailPath
    }));
  };

  const handleThumbnailRemove = (oldPath) => {
    setFormData((prev) => ({
      ...prev,
      thumbnail_url: '',
      replacedOldThumbnailPath: oldPath || prev.replacedOldThumbnailPath
    }));
  };

  const handleVideoChange = (uploadResult) => {
    if (!uploadResult) {
      setFormData((prev) => ({
        ...prev,
        video_url: null,
        video_duration: '',
        video_duration_seconds: 0,
        replacedOldVideoPath: prev.video_url || null
      }));
      return;
    }
    setFormData((prev) => ({
      ...prev,
      video_url: uploadResult.url,
      video_duration: uploadResult.duration || prev.video_duration || '0:30',
      video_duration_seconds: uploadResult.durationSeconds || prev.video_duration_seconds || 30,
      replacedOldVideoPath: uploadResult.replacedOldPath || prev.replacedOldVideoPath
    }));
  };

  const handleVideoRemove = (oldPath) => {
    setFormData((prev) => ({
      ...prev,
      video_url: null,
      video_duration: '',
      video_duration_seconds: 0,
      replacedOldVideoPath: oldPath || prev.replacedOldVideoPath
    }));
  };

  const handleAudioChange = (uploadResult) => {
    if (!uploadResult) {
      setFormData((prev) => ({
        ...prev,
        audio_url: null,
        audio_duration: '',
        audio_duration_seconds: 0,
        replacedOldAudioPath: prev.audio_url || null
      }));
      return;
    }
    setFormData((prev) => ({
      ...prev,
      audio_url: uploadResult.url,
      audio_duration: uploadResult.duration || prev.audio_duration || '4 min',
      audio_duration_seconds: uploadResult.durationSeconds || prev.audio_duration_seconds || 240,
      replacedOldAudioPath: uploadResult.replacedOldPath || prev.replacedOldAudioPath
    }));
  };

  const handleAudioRemove = (oldPath) => {
    setFormData((prev) => ({
      ...prev,
      audio_url: null,
      audio_duration: '',
      audio_duration_seconds: 0,
      replacedOldAudioPath: oldPath || prev.replacedOldAudioPath
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Spark title is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave(formData);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Spark' : 'Create New Spark'}
      size="lg"
      footer={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            {isUploadingMedia && (
              <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600 }}>
                Direct media upload in progress...
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Button variant="secondary" onClick={onClose} disabled={loading || isUploadingMedia}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              loading={loading}
              disabled={isUploadingMedia}
            >
              {initialData ? 'Save Changes' : 'Create Spark'}
            </Button>
          </div>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        
        {/* ============================================================ */}
        {/* SECTION 1: CONTENT                                          */}
        {/* ============================================================ */}
        <div className="form-section">
          <div className="form-section-title">Content Overview</div>
          
          <Input
            label="Spark Title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="e.g. The Architecture of Quiet Clarity"
            required
            error={errors.title}
            helperText="The primary contemplation title displayed across the app"
          />

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 190px), 1fr))',
              gap: '1rem',
              marginTop: '0.75rem'
            }}
          >
            <Select
              label="Category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              options={CATEGORY_OPTIONS}
              required
            />

            <Input
              label="Read Duration"
              name="duration"
              value={formData.duration}
              onChange={handleChange}
              placeholder="e.g. 4 min"
              helperText="Estimated reflection time"
            />

            <Select
              label="Publication Status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              options={STATUS_OPTIONS}
              required
            />
          </div>
        </div>

        {/* ============================================================ */}
        {/* SECTION 2: MEDIA                                            */}
        {/* ============================================================ */}
        <div className="form-section">
          <div className="form-section-title">Media Assets</div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '-0.5rem', marginBottom: '1rem' }}>
            Direct file uploads to Supabase Storage. Assets are automatically linked to this Spark.
          </p>

          <MediaUploadField
            type="image"
            label="Thumbnail / Poster"
            value={formData.thumbnail_url}
            onChange={handleThumbnailChange}
            onRemove={handleThumbnailRemove}
            onUploadStateChange={setIsUploadingMedia}
            helperText="Cover image featured on daily cards and the Spark contemplation screen"
          />

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
              gap: '1rem'
            }}
          >
            <MediaUploadField
              type="video"
              label="Video (Optional)"
              value={formData.video_url}
              duration={formData.video_duration}
              onChange={handleVideoChange}
              onRemove={handleVideoRemove}
              onUploadStateChange={setIsUploadingMedia}
              helperText="Optional visual contemplation video for mobile playback"
            />

            <MediaUploadField
              type="audio"
              label="Audio (Optional)"
              value={formData.audio_url}
              duration={formData.audio_duration}
              onChange={handleAudioChange}
              onRemove={handleAudioRemove}
              onUploadStateChange={setIsUploadingMedia}
              helperText="Optional audio soundscape or spoken guidance for this Spark"
            />
          </div>
        </div>

        {/* ============================================================ */}
        {/* SECTION 3: CONTENT DETAILS                                  */}
        {/* ============================================================ */}
        <div className="form-section">
          <div className="form-section-title">Content Details & Practice</div>

          <Textarea
            label="Short Description / Subtitle"
            name="short_description"
            value={formData.short_description}
            onChange={handleChange}
            rows={2}
            placeholder="A brief editorial summary of this contemplation..."
            helperText="Appears on recommendation cards and contemplation summaries"
          />

          <Textarea
            label="Reflection / Principle Heading"
            name="reflection"
            value={formData.reflection}
            onChange={handleChange}
            rows={3}
            placeholder="The core principle or quote (e.g. Cognitive overload blurs the boundary between urgency and genuine importance.)"
            helperText="The prominent quote or reflection highlight"
          />

          <Textarea
            label="Insight"
            name="insight"
            value={formData.insight}
            onChange={handleChange}
            rows={2}
            placeholder="Key takeaway (e.g. Stillness protects cognitive energy before high-stakes choices.)"
            helperText="Key strategic or mental clarity takeaway"
          />

          <Textarea
            label="1-Minute Practice (Action Steps)"
            name="practice"
            value={formData.practice}
            onChange={handleChange}
            rows={3}
            placeholder="Step-by-step guidance. (e.g. Take three uninterrupted breaths before opening communications.)"
            helperText="Practical, actionable ritual or mindfulness exercise"
          />
        </div>

        {/* ============================================================ */}
        {/* SECTION 4: ACCESS                                           */}
        {/* ============================================================ */}
        <div className="form-section" style={{ marginBottom: 0 }}>
          <div className="form-section-title">Access Permission</div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.85rem 1rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
              backgroundColor: formData.is_vip ? 'var(--accent-vip-bg)' : 'var(--bg-surface)',
              transition: 'background-color var(--transition-fast)'
            }}
          >
            <input
              type="checkbox"
              id="is_vip"
              name="is_vip"
              checked={formData.is_vip}
              onChange={handleChange}
              style={{
                width: '18px',
                height: '18px',
                accentColor: 'var(--accent-vip)',
                cursor: 'pointer'
              }}
            />
            <label
              htmlFor="is_vip"
              style={{
                fontSize: '0.88rem',
                fontWeight: 600,
                color: formData.is_vip ? 'var(--accent-vip)' : 'var(--text-main)',
                cursor: 'pointer',
                margin: 0
              }}
            >
              VIP Content Only (Requires VIP Membership to unlock)
            </label>
          </div>
        </div>

      </form>
    </Modal>
  );
};

export default SparkFormModal;
