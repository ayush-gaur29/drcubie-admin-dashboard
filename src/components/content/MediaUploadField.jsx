import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Image as ImageIcon,
  Film,
  Music,
  Trash2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock,
  HardDrive
} from 'lucide-react';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import Badge from '../ui/Badge';
import {
  uploadStorageFileWithProgress,
  getStoragePathFromUrl,
  getMediaDuration
} from '../../services/media/storageAdminService';
import { formatBytes } from '../../utils/formatters';

const TYPE_CONFIG = {
  image: {
    bucket: 'thumbnails',
    accept: 'image/jpeg,image/png,image/webp',
    allowedMimes: ['image/jpeg', 'image/png', 'image/webp'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
    maxSizeMb: 10,
    hintText: 'JPG, PNG, WEBP (Max 10MB)',
    icon: ImageIcon,
    labelDefault: 'Thumbnail / Poster'
  },
  video: {
    bucket: 'videos',
    accept: 'video/mp4,video/webm,video/quicktime',
    allowedMimes: ['video/mp4', 'video/webm', 'video/quicktime'],
    allowedExtensions: ['.mp4', '.webm', '.mov'],
    maxSizeMb: 100,
    hintText: 'MP4, WebM, MOV (Max 100MB)',
    icon: Film,
    labelDefault: 'Video (Optional)'
  },
  audio: {
    bucket: 'audio',
    accept: 'audio/mpeg,audio/wav,audio/mp4,audio/aac,audio/x-m4a,audio/ogg',
    allowedMimes: [
      'audio/mpeg',
      'audio/wav',
      'audio/mp4',
      'audio/aac',
      'audio/x-m4a',
      'audio/ogg',
      'audio/mp3'
    ],
    allowedExtensions: ['.mp3', '.wav', '.m4a', '.aac', '.ogg'],
    maxSizeMb: 50,
    hintText: 'MP3, WAV, M4A, AAC (Max 50MB)',
    icon: Music,
    labelDefault: 'Audio (Optional)'
  }
};

export const MediaUploadField = ({
  type = 'image', // 'image' | 'video' | 'audio'
  label,
  value, // existing or current publicUrl
  existingPath = null,
  duration = '',
  onChange, // ({ url, path, file, duration, durationSeconds, replacedOldPath }) => void
  onRemove, // () => void
  onUploadStateChange, // (isUploading: boolean) => void
  required = false,
  helperText,
  className = ''
}) => {
  const config = TYPE_CONFIG[type] || TYPE_CONFIG.image;
  const displayLabel = label || config.labelDefault;
  const IconComponent = config.icon;

  const fileInputRef = useRef(null);

  const [previewUrl, setPreviewUrl] = useState(value || '');
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState(null);
  const [mediaDuration, setMediaDuration] = useState(duration || '');

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);

  // Synchronize when value changes externally
  useEffect(() => {
    setPreviewUrl(value || '');
    if (value && !fileName) {
      // Extract filename from URL
      try {
        const parts = value.split('/');
        const raw = parts[parts.length - 1]?.split('?')[0] || '';
        // Remove timestamp prefix if present (e.g. 1727500000_name.ext)
        const clean = raw.replace(/^\d+_/, '');
        setFileName(decodeURIComponent(clean) || `Uploaded ${type}`);
      } catch {
        setFileName(`Current ${type}`);
      }
    }
    if (!value) {
      setFileName('');
      setFileSize(null);
    }
  }, [value, type]);

  useEffect(() => {
    if (duration) {
      setMediaDuration(duration);
    }
  }, [duration]);

  const validateFile = (file) => {
    setErrorMessage('');
    if (!file) return false;

    // Check extension and mime
    const nameLower = file.name.toLowerCase();
    const hasValidExt = config.allowedExtensions.some((ext) => nameLower.endsWith(ext));
    const hasValidMime = config.allowedMimes.includes(file.type);

    if (!hasValidExt && !hasValidMime) {
      setErrorMessage(`Invalid file format. Allowed: ${config.hintText}`);
      return false;
    }

    const maxBytes = config.maxSizeMb * 1024 * 1024;
    if (file.size > maxBytes) {
      setErrorMessage(
        `File size (${formatBytes(file.size)}) exceeds the maximum limit of ${config.maxSizeMb}MB.`
      );
      return false;
    }

    return true;
  };

  const processAndUploadFile = async (file) => {
    if (!validateFile(file)) return;

    setUploading(true);
    setUploadProgress(10);
    if (onUploadStateChange) onUploadStateChange(true);

    try {
      // Calculate duration for video or audio
      let calculatedDuration = '';
      let calculatedSeconds = 0;
      if (type === 'video' || type === 'audio') {
        const dur = await getMediaDuration(file, type);
        calculatedDuration = dur.formatted;
        calculatedSeconds = dur.seconds;
        setMediaDuration(calculatedDuration);
      }

      setFileName(file.name);
      setFileSize(file.size);

      // Identify if we are replacing an existing Supabase Storage object
      const oldStoragePath = previewUrl ? getStoragePathFromUrl(previewUrl, config.bucket) : existingPath;

      // Direct upload to Supabase Storage bucket
      const result = await uploadStorageFileWithProgress(
        config.bucket,
        file,
        'sparks',
        (prog) => setUploadProgress(prog)
      );

      setPreviewUrl(result.publicUrl);
      setErrorMessage('');

      if (onChange) {
        onChange({
          url: result.publicUrl,
          path: result.path,
          file,
          duration: calculatedDuration,
          durationSeconds: calculatedSeconds,
          replacedOldPath: oldStoragePath
        });
      }
    } catch (err) {
      console.error(`[MediaUploadField] Upload error (${type}):`, err);
      setErrorMessage(err.message || `Failed to upload ${type}. Please try again.`);
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (onUploadStateChange) onUploadStateChange(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      processAndUploadFile(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!uploading) setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (uploading) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      processAndUploadFile(file);
    }
  };

  const handleReplaceClick = () => {
    if (fileInputRef.current && !uploading) {
      fileInputRef.current.click();
    }
  };

  const handleRemoveClick = () => {
    // Determine old path for potential cleanup upon save
    const oldStoragePath = previewUrl ? getStoragePathFromUrl(previewUrl, config.bucket) : existingPath;

    setPreviewUrl('');
    setFileName('');
    setFileSize(null);
    setMediaDuration('');
    setErrorMessage('');

    if (onRemove) {
      onRemove(oldStoragePath);
    } else if (onChange) {
      onChange(null);
    }
  };

  return (
    <div className={`form-group ${className}`.trim()} style={{ marginBottom: '1.25rem' }}>
      {/* Label and Helper Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
        <label className="form-label" style={{ marginBottom: 0 }}>
          {displayLabel}
          {required && <span className="required-star">*</span>}
        </label>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          {config.hintText}
        </span>
      </div>

      {/* Hidden Native File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={config.accept}
        onChange={handleFileSelect}
        style={{ display: 'none' }}
        disabled={uploading}
      />

      {/* Validation or Upload Error Banner */}
      {errorMessage && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.55rem 0.75rem',
            backgroundColor: 'var(--danger-bg)',
            color: 'var(--danger)',
            border: '1px solid var(--danger-border)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.78rem',
            marginBottom: '0.65rem'
          }}
          role="alert"
        >
          <AlertCircle size={15} style={{ flexShrink: 0 }} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* State 1: Active Upload Progress */}
      {uploading && (
        <div
          style={{
            padding: '1.25rem',
            border: '1px solid var(--primary-border)',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--primary-light)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.65rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', fontWeight: 600, color: 'var(--primary)' }}>
              <Spinner size={16} />
              <span>Uploading {fileName || type}...</span>
            </div>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--primary)' }}>
              {uploadProgress}%
            </span>
          </div>

          {/* Progress bar container */}
          <div
            style={{
              width: '100%',
              height: '6px',
              backgroundColor: 'rgba(37, 99, 235, 0.2)',
              borderRadius: '3px',
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                width: `${uploadProgress}%`,
                height: '100%',
                backgroundColor: 'var(--primary)',
                transition: 'width 0.2s ease-out'
              }}
            />
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            Uploading directly to Supabase Storage ({config.bucket} bucket)
          </span>
        </div>
      )}

      {/* State 2: Media Uploaded / Existing Value Present */}
      {!uploading && previewUrl && (
        <div
          className="media-preview-card"
          style={{
            border: '1px solid var(--border-card)',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--bg-surface)',
            padding: '0.85rem',
            boxShadow: 'var(--shadow-xs)'
          }}
        >
          {/* Header Info & Action Controls */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '0.75rem',
              gap: '0.5rem',
              flexWrap: 'wrap'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: 'var(--radius-xs)',
                  backgroundColor: 'var(--primary-light)',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <IconComponent size={15} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    color: 'var(--text-main)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '220px'
                  }}
                  title={fileName}
                >
                  {fileName || `Uploaded ${type}`}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  {fileSize ? <span>{formatBytes(fileSize)}</span> : null}
                  {mediaDuration ? <span>• {mediaDuration}</span> : null}
                  <Badge variant="success" style={{ padding: '1px 5px', fontSize: '0.68rem' }}>
                    <CheckCircle2 size={10} style={{ marginRight: '2px' }} /> Ready
                  </Badge>
                </div>
              </div>
            </div>

            {/* Replace and Remove buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                icon={RefreshCw}
                onClick={handleReplaceClick}
                title={`Replace ${type}`}
                style={{ padding: '0.35rem 0.65rem', fontSize: '0.76rem' }}
              >
                Replace
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                icon={Trash2}
                onClick={handleRemoveClick}
                title={`Remove ${type}`}
                style={{
                  padding: '0.35rem 0.55rem',
                  fontSize: '0.76rem',
                  color: 'var(--danger)'
                }}
              >
                Remove
              </Button>
            </div>
          </div>

          {/* Compact Media Previews (Requirement 11) */}
          {type === 'image' && (
            <div
              style={{
                textAlign: 'center',
                backgroundColor: '#0f172a',
                borderRadius: 'var(--radius-sm)',
                padding: '6px',
                overflow: 'hidden',
                maxHeight: '160px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <img
                src={previewUrl}
                alt="Uploaded thumbnail preview"
                style={{
                  maxHeight: '148px',
                  maxWidth: '100%',
                  objectFit: 'contain',
                  borderRadius: '4px'
                }}
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
          )}

          {type === 'video' && (
            <div
              style={{
                backgroundColor: '#000000',
                borderRadius: 'var(--radius-sm)',
                overflow: 'hidden',
                position: 'relative'
              }}
            >
              <video
                src={previewUrl}
                controls
                playsInline
                preload="metadata"
                style={{
                  width: '100%',
                  maxHeight: '180px',
                  display: 'block',
                  backgroundColor: '#000'
                }}
              >
                Your browser does not support the video tag.
              </video>
            </div>
          )}

          {type === 'audio' && (
            <div
              style={{
                padding: '0.65rem 0.85rem',
                backgroundColor: 'var(--bg-muted)',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.4rem'
              }}
            >
              <audio
                src={previewUrl}
                controls
                preload="metadata"
                style={{ width: '100%', height: '36px' }}
              >
                Your browser does not support the audio element.
              </audio>
            </div>
          )}
        </div>
      )}

      {/* State 3: Empty State / Dropzone */}
      {!uploading && !previewUrl && (
        <div
          onClick={handleReplaceClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          style={{
            border: isDragOver ? '2px dashed var(--primary)' : '2px dashed var(--border-card)',
            borderRadius: 'var(--radius-md)',
            backgroundColor: isDragOver ? 'var(--primary-light)' : 'var(--bg-muted)',
            padding: '1.35rem 1rem',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all var(--transition-fast)'
          }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleReplaceClick();
            }
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: isDragOver ? 'rgba(37, 99, 235, 0.2)' : 'var(--bg-surface)',
              color: isDragOver ? 'var(--primary)' : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 0.6rem auto',
              boxShadow: 'var(--shadow-xs)'
            }}
          >
            <Upload size={18} />
          </div>

          <div style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.2rem' }}>
            Choose {displayLabel} or drag & drop
          </div>
          <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', margin: 0 }}>
            Upload directly to {config.bucket} storage • {config.hintText}
          </p>
        </div>
      )}

      {helperText && !errorMessage && (
        <span className="form-helper-text" style={{ marginTop: '0.35rem', display: 'block' }}>
          {helperText}
        </span>
      )}
    </div>
  );
};

export default MediaUploadField;
