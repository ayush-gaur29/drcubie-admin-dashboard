import React, { useState } from 'react';
import { Upload, CheckCircle2, AlertCircle } from 'lucide-react';
import Button from '../ui/Button';

export const MediaUploader = ({
  bucketName = 'thumbnails',
  acceptedMime = 'image/*',
  maxSizeMb = 10,
  onUploadSuccess,
  uploadFunction
}) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setSuccess(false);

    if (file.size > maxSizeMb * 1024 * 1024) {
      setError(`File exceeds maximum size of ${maxSizeMb}MB.`);
      return;
    }

    setUploading(true);
    try {
      const url = await uploadFunction(file);
      setSuccess(true);
      if (onUploadSuccess) onUploadSuccess(url, file.name);
    } catch (err) {
      setError(err.message || 'Upload failed.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <label
        style={{
          border: '2px dashed var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '1.25rem',
          textAlign: 'center',
          cursor: uploading ? 'not-allowed' : 'pointer',
          backgroundColor: 'var(--bg-muted)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.5rem',
          transition: 'border-color 0.2s ease'
        }}
      >
        <Upload size={22} color="var(--primary)" />
        <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
          {uploading ? 'Uploading to storage...' : `Upload to ${bucketName}`}
        </span>
        <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
          Supported types ({acceptedMime}) • Max {maxSizeMb}MB
        </span>
        <input
          type="file"
          accept={acceptedMime}
          onChange={handleFile}
          disabled={uploading}
          style={{ display: 'none' }}
        />
      </label>

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--danger)', fontSize: '0.78rem' }}>
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--success)', fontSize: '0.78rem' }}>
          <CheckCircle2 size={14} />
          <span>Asset uploaded successfully!</span>
        </div>
      )}
    </div>
  );
};

export default MediaUploader;
