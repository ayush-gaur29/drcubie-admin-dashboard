import React from 'react';
import { Calendar as CalendarIcon, ChevronDown } from 'lucide-react';

const RANGE_OPTIONS = [
  { key: 'today', label: 'Today' },
  { key: 'last_7_days', label: 'Last 7 Days' },
  { key: 'last_30_days', label: 'Last 30 Days' },
  { key: 'last_3_months', label: 'Last 3 Months' },
  { key: 'last_12_months', label: 'Last 12 Months' },
  { key: 'all_time', label: 'All Time' },
  { key: 'custom', label: 'Custom Range' }
];

export const DateRangeFilter = ({
  selectedRange,
  onRangeChange,
  customStart,
  customEnd,
  onCustomStartChange,
  onCustomEndChange,
  disabled = false
}) => {
  return (
    <div className="payment-date-filter-wrapper">
      <div className="payment-date-buttons-bar">
        {RANGE_OPTIONS.map((opt) => (
          <button
            key={opt.key}
            type="button"
            className={`btn-date-filter ${selectedRange === opt.key ? 'active' : ''}`}
            onClick={() => onRangeChange(opt.key)}
            disabled={disabled}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {selectedRange === 'custom' && (
        <div className="payment-custom-date-row animate-fade-in">
          <div className="payment-custom-input-group">
            <span className="payment-custom-label">From:</span>
            <input
              type="date"
              className="payment-date-input"
              value={customStart || ''}
              onChange={(e) => onCustomStartChange(e.target.value)}
              disabled={disabled}
            />
          </div>
          <div className="payment-custom-input-group">
            <span className="payment-custom-label">To:</span>
            <input
              type="date"
              className="payment-date-input"
              value={customEnd || ''}
              onChange={(e) => onCustomEndChange(e.target.value)}
              disabled={disabled}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default DateRangeFilter;
