import React from 'react';

export const KpiCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color = '#1e40af',
  bgColor = '#eff6ff'
}) => {
  return (
    <div className="kpi-card">
      <div className="kpi-card-content">
        <span className="kpi-title">{title}</span>
        <span className="kpi-value">{value}</span>
        {subtitle && <span className="kpi-subtitle">{subtitle}</span>}
      </div>
      {Icon && (
        <div className="kpi-icon-box" style={{ backgroundColor: bgColor, color }}>
          <Icon size={22} />
        </div>
      )}
    </div>
  );
};

export default KpiCard;
