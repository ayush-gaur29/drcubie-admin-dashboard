import React from 'react';

export const Textarea = ({
  label,
  name,
  value,
  onChange,
  rows = 3,
  placeholder,
  error,
  helperText,
  required = false,
  disabled = false,
  className = '',
  ...props
}) => {
  return (
    <div className={`form-group ${className}`.trim()}>
      {label && (
        <label className="form-label" htmlFor={name}>
          {label}
          {required && <span className="required-star">*</span>}
        </label>
      )}
      <textarea
        id={name}
        name={name}
        rows={rows}
        value={value ?? ''}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className="form-textarea"
        style={error ? { borderColor: 'var(--danger)' } : {}}
        {...props}
      />
      {error && <span className="form-error-text">{error}</span>}
      {!error && helperText && <span className="form-helper-text">{helperText}</span>}
    </div>
  );
};

export default Textarea;
