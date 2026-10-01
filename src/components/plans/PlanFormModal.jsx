import React, { useState, useEffect } from 'react';
import { Plus, Trash2, CheckCircle2 } from 'lucide-react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Textarea from '../ui/Textarea';
import Button from '../ui/Button';

const PLAN_TYPE_OPTIONS = [
  { value: 'Monthly', label: 'Monthly' },
  { value: 'Annual', label: 'Annual' },
  { value: 'Custom', label: 'Custom' }
];

const BILLING_PERIOD_OPTIONS = [
  { value: 'Monthly', label: 'Monthly' },
  { value: 'Yearly', label: 'Yearly' },
  { value: 'Custom', label: 'Custom' }
];

export const PlanFormModal = ({
  isOpen,
  onClose,
  onSave,
  initialData = null,
  loading = false
}) => {
  const isEditMode = Boolean(initialData?.id);

  const [formData, setFormData] = useState({
    name: '',
    plan_type: 'Monthly',
    price: '',
    billing_period: 'Monthly',
    description: '',
    is_active: true,
    display_order: '0',
    features: []
  });

  const [featureInput, setFeatureInput] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          name: initialData.name || '',
          plan_type: initialData.plan_type || 'Monthly',
          price:
            initialData.price !== undefined && initialData.price !== null
              ? String(initialData.price)
              : '',
          billing_period: initialData.billing_period || 'Monthly',
          description: initialData.description || '',
          is_active:
            initialData.is_active !== undefined ? Boolean(initialData.is_active) : true,
          display_order:
            initialData.display_order !== undefined && initialData.display_order !== null
              ? String(initialData.display_order)
              : '0',
          features: Array.isArray(initialData.features) ? [...initialData.features] : []
        });
      } else {
        // Create mode: start with clean empty fields and empty features list
        setFormData({
          name: '',
          plan_type: 'Monthly',
          price: '',
          billing_period: 'Monthly',
          description: '',
          is_active: true,
          display_order: '0',
          features: []
        });
      }
      setFeatureInput('');
      setErrors({});
    }
  }, [isOpen, initialData]);

  // Sync plan_type with billing_period default if user changes type
  const handlePlanTypeChange = (e) => {
    const newType = e.target.value;
    setFormData((prev) => {
      let defaultPeriod = prev.billing_period;
      if (newType === 'Monthly') defaultPeriod = 'Monthly';
      else if (newType === 'Annual') defaultPeriod = 'Yearly';
      else if (newType === 'Custom') defaultPeriod = 'Custom';

      return {
        ...prev,
        plan_type: newType,
        billing_period: defaultPeriod
      };
    });
  };

  const handleAddFeature = () => {
    const trimmed = featureInput.trim();
    if (!trimmed) return;
    if (formData.features.includes(trimmed)) {
      setFeatureInput('');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      features: [...prev.features, trimmed]
    }));
    setFeatureInput('');
  };

  const handleRemoveFeature = (indexToRemove) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.filter((_, idx) => idx !== indexToRemove)
    }));
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Plan Name is required';
    }

    if (formData.price === '' || formData.price === null || formData.price === undefined) {
      newErrors.price = 'Price is required';
    } else {
      const priceVal = parseFloat(formData.price);
      if (isNaN(priceVal) || priceVal < 0) {
        newErrors.price = 'Price must be a valid non-negative number (e.g. 0 or 9.99)';
      }
    }

    if (formData.display_order !== '') {
      const orderVal = parseInt(formData.display_order, 10);
      if (isNaN(orderVal) || orderVal < 0) {
        newErrors.display_order = 'Display order must be 0 or higher';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!validate()) return;

    await onSave({
      ...formData,
      price: parseFloat(formData.price) || 0,
      display_order: parseInt(formData.display_order, 10) || 0,
      // Preserve existing database values if editing an existing plan
      discount_text: initialData?.discount_text !== undefined ? initialData.discount_text : null,
      features: formData.features
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Edit Membership Plan' : 'Create New Membership Plan'}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={loading}>
            {isEditMode ? 'Save Changes' : 'Create Plan'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Row 1: Plan Name & Plan Type */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
          <Input
            label="Plan Name"
            name="name"
            placeholder="e.g. Annual Membership, Monthly VIP"
            value={formData.name}
            onChange={(e) => {
              setFormData({ ...formData, name: e.target.value });
              if (errors.name) setErrors({ ...errors, name: null });
            }}
            required
            error={errors.name}
            helperText="The title displayed to users on the membership selection screen."
          />

          <Select
            label="Plan Type"
            name="plan_type"
            value={formData.plan_type}
            onChange={handlePlanTypeChange}
            options={PLAN_TYPE_OPTIONS}
            required
            helperText="Determines billing model and categorization."
          />
        </div>

        {/* Row 2: Price & Billing Period */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
          <Input
            label="Price ($ USD)"
            name="price"
            type="number"
            step="0.01"
            min="0"
            placeholder="9.99"
            value={formData.price}
            onChange={(e) => {
              setFormData({ ...formData, price: e.target.value });
              if (errors.price) setErrors({ ...errors, price: null });
            }}
            required
            error={errors.price}
            helperText="Recurring cost per period (use 0 for free tiers)."
          />

          <Select
            label="Billing Period"
            name="billing_period"
            value={formData.billing_period}
            onChange={(e) => setFormData({ ...formData, billing_period: e.target.value })}
            options={BILLING_PERIOD_OPTIONS}
            required
            helperText="Cadence at which member renewals occur."
          />
        </div>

        {/* Row 3: Short Description */}
        <Textarea
          label="Short Description"
          name="description"
          rows={2}
          placeholder="Brief summary of what members experience under this plan..."
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          helperText="Provides context and editorial warmth for this tier."
          style={{ marginBottom: 0 }}
        />

        {/* Features / Benefits Builder */}
        <div
          style={{
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '1rem',
            backgroundColor: 'var(--bg-muted)'
          }}
        >
          <div style={{ marginBottom: '0.75rem' }}>
            <label className="form-label" style={{ marginBottom: '2px', fontWeight: 600 }}>
              Features & Member Benefits ({formData.features.length})
            </label>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Add the key privileges included in this membership plan.
            </div>
          </div>

          {/* Add Feature Input Row */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', alignItems: 'flex-start' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <input
                type="text"
                className="form-input"
                placeholder="Type a feature and press Enter (e.g. 'Unlimited Sparks')..."
                value={featureInput}
                onChange={(e) => setFeatureInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddFeature();
                  }
                }}
                style={{ width: '100%', marginBottom: 0 }}
              />
            </div>
            <Button
              type="button"
              variant="secondary"
              icon={Plus}
              onClick={handleAddFeature}
              disabled={!featureInput.trim()}
              style={{ flexShrink: 0 }}
            >
              Add
            </Button>
          </div>

          {/* Added Features List */}
          {formData.features.length === 0 ? (
            <div
              style={{
                padding: '1rem',
                backgroundColor: 'var(--bg-card)',
                borderRadius: 'var(--radius-xs)',
                textAlign: 'center',
                color: 'var(--text-muted)',
                fontSize: '0.8rem',
                border: '1px dashed var(--border-subtle)'
              }}
            >
              No features added yet. Type a feature above and click Add.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {formData.features.map((feature, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.6rem 0.85rem',
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-xs)',
                    gap: '0.75rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: 0 }}>
                    <CheckCircle2 size={16} color="var(--accent-vip)" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-main)', wordBreak: 'break-word' }}>
                      {feature}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveFeature(idx)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: '4px',
                      borderRadius: 'var(--radius-xs)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'color 0.15s ease'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--danger)')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                    title="Remove benefit"
                    aria-label={`Remove benefit ${feature}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Row 4: Display Order & Active Status */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '1rem',
            alignItems: 'center',
            paddingTop: '0.5rem',
            borderTop: '1px solid var(--border-subtle)'
          }}
        >
          <Input
            label="Display Order"
            name="display_order"
            type="number"
            min="0"
            step="1"
            placeholder="0"
            value={formData.display_order}
            onChange={(e) => {
              setFormData({ ...formData, display_order: e.target.value });
              if (errors.display_order) setErrors({ ...errors, display_order: null });
            }}
            error={errors.display_order}
            helperText="Lower numbers appear first (e.g. 0, 1, 2)."
            style={{ marginBottom: 0 }}
          />

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.85rem 1rem',
              backgroundColor: 'var(--bg-muted)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)'
            }}
          >
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-main)' }}>
                Plan Status
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {formData.is_active ? 'Active — Available for members' : 'Inactive — Hidden from members'}
              </div>
            </div>

            <label
              style={{
                position: 'relative',
                display: 'inline-block',
                width: '44px',
                height: '24px',
                cursor: 'pointer'
              }}
            >
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span
                style={{
                  position: 'absolute',
                  cursor: 'pointer',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: formData.is_active ? 'var(--accent-vip)' : 'var(--border-subtle)',
                  borderRadius: '24px',
                  transition: '0.2s'
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    content: '""',
                    height: '18px',
                    width: '18px',
                    left: formData.is_active ? '23px' : '3px',
                    bottom: '3px',
                    backgroundColor: '#ffffff',
                    borderRadius: '50%',
                    transition: '0.2s',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                  }}
                />
              </span>
            </label>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default PlanFormModal;
