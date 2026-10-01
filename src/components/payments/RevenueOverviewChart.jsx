import React, { useState, useMemo } from 'react';
import { formatCurrency } from '../../utils/formatters';
import { TrendingUp, Calendar, DollarSign, CreditCard } from 'lucide-react';

export const RevenueOverviewChart = ({ trend }) => {
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [activeMetric, setActiveMetric] = useState('revenue'); // 'revenue' | 'count'

  const buckets = trend?.buckets || [];
  const granularity = trend?.granularity || 'daily';

  // Calculate dimensions and scales
  const chartHeight = 240;
  const chartWidth = 720;
  const padding = { top: 20, right: 30, bottom: 40, left: 60 };

  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  const maxRevenue = useMemo(() => {
    const maxVal = Math.max(...buckets.map((b) => b.revenue), 0);
    return maxVal === 0 ? 100 : Math.ceil(maxVal * 1.15);
  }, [buckets]);

  const maxCount = useMemo(() => {
    const maxVal = Math.max(...buckets.map((b) => b.count), 0);
    return maxVal === 0 ? 5 : Math.ceil(maxVal * 1.25);
  }, [buckets]);

  const totalPeriodRevenue = useMemo(() => {
    return buckets.reduce((s, b) => s + b.revenue, 0);
  }, [buckets]);

  const totalPeriodCount = useMemo(() => {
    return buckets.reduce((s, b) => s + b.count, 0);
  }, [buckets]);

  // Generate coordinates for SVG polyline and polygon
  const points = useMemo(() => {
    if (buckets.length === 0) return [];
    const step = buckets.length > 1 ? innerWidth / (buckets.length - 1) : innerWidth / 2;

    return buckets.map((b, idx) => {
      const x = padding.left + (buckets.length === 1 ? innerWidth / 2 : idx * step);
      const val = activeMetric === 'revenue' ? b.revenue : b.count;
      const maxVal = activeMetric === 'revenue' ? maxRevenue : maxCount;
      const y = padding.top + innerHeight - (maxVal > 0 ? (val / maxVal) * innerHeight : 0);

      return {
        x,
        y,
        bucket: b,
        index: idx
      };
    });
  }, [buckets, activeMetric, maxRevenue, maxCount, innerWidth, innerHeight]);

  // Construct SVG path strings
  const linePath = useMemo(() => {
    if (points.length === 0) return '';
    if (points.length === 1) {
      return `M ${points[0].x - 20},${points[0].y} L ${points[0].x + 20},${points[0].y}`;
    }

    return points.reduce((path, pt, i) => {
      if (i === 0) return `M ${pt.x},${pt.y}`;
      // Smooth cubic bezier or straight lines
      const prev = points[i - 1];
      const cx = (prev.x + pt.x) / 2;
      return `${path} C ${cx},${prev.y} ${cx},${pt.y} ${pt.x},${pt.y}`;
    }, '');
  }, [points]);

  const areaPath = useMemo(() => {
    if (points.length === 0) return '';
    const bottomY = padding.top + innerHeight;
    const firstX = points[0].x;
    const lastX = points[points.length - 1].x;

    if (points.length === 1) {
      return `M ${firstX - 20},${bottomY} L ${firstX - 20},${points[0].y} L ${firstX + 20},${points[0].y} L ${firstX + 20},${bottomY} Z`;
    }

    return `${linePath} L ${lastX},${bottomY} L ${firstX},${bottomY} Z`;
  }, [linePath, points, innerHeight]);

  // Y-axis tick values
  const yTicks = useMemo(() => {
    const count = 4;
    const ticks = [];
    const maxVal = activeMetric === 'revenue' ? maxRevenue : maxCount;
    for (let i = 0; i <= count; i++) {
      const val = Math.round((maxVal / count) * i);
      const y = padding.top + innerHeight - (val / maxVal) * innerHeight;
      ticks.push({
        val: activeMetric === 'revenue' ? formatCurrency(val) : `${val}`,
        y
      });
    }
    return ticks;
  }, [activeMetric, maxRevenue, maxCount, innerHeight]);

  // X-axis label decimation for readability
  const xLabels = useMemo(() => {
    if (points.length <= 10) return points;
    const interval = Math.ceil(points.length / 7);
    return points.filter((_, i) => i === 0 || i === points.length - 1 || i % interval === 0);
  }, [points]);

  return (
    <div className="card payment-chart-card">
      <div className="card-header payment-chart-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={18} color="var(--primary)" />
            <h3 className="card-title">Revenue Overview</h3>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Authoritative Stripe transaction revenue & payment volume over time ({granularity} granularity)
          </p>
        </div>

        <div className="payment-chart-controls">
          <div className="payment-chart-summary-stat">
            <span className="stat-label">Period Total:</span>
            <span className="stat-val">{formatCurrency(totalPeriodRevenue)}</span>
            <span className="stat-sub">({totalPeriodCount} payments)</span>
          </div>

          <div className="payment-metric-toggle">
            <button
              type="button"
              className={`metric-toggle-btn ${activeMetric === 'revenue' ? 'active' : ''}`}
              onClick={() => setActiveMetric('revenue')}
            >
              <DollarSign size={13} />
              <span>Revenue</span>
            </button>
            <button
              type="button"
              className={`metric-toggle-btn ${activeMetric === 'count' ? 'active' : ''}`}
              onClick={() => setActiveMetric('count')}
            >
              <CreditCard size={13} />
              <span>Payments</span>
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Chart Container */}
      <div className="payment-chart-body">
        {buckets.length === 0 ? (
          <div className="payment-chart-empty">
            <Calendar size={32} color="var(--text-faint)" />
            <span>No payment activity recorded in this period.</span>
          </div>
        ) : (
          <div className="payment-svg-wrap">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="payment-trend-svg"
              preserveAspectRatio="xMidYMid meet"
              onMouseLeave={() => setHoveredPoint(null)}
            >
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="countGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent-vip)" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="var(--accent-vip)" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid lines */}
              {yTicks.map((t, idx) => (
                <g key={`grid-${idx}`}>
                  <line
                    x1={padding.left}
                    y1={t.y}
                    x2={chartWidth - padding.right}
                    y2={t.y}
                    stroke="var(--border-subtle)"
                    strokeDasharray="3 3"
                    strokeWidth="1"
                  />
                  <text
                    x={padding.left - 10}
                    y={t.y + 4}
                    textAnchor="end"
                    fill="var(--text-faint)"
                    fontSize="10"
                    fontFamily="var(--font-sans)"
                  >
                    {t.val}
                  </text>
                </g>
              ))}

              {/* Area fill under curve */}
              <path
                d={areaPath}
                fill={activeMetric === 'revenue' ? 'url(#revenueGradient)' : 'url(#countGradient)'}
              />

              {/* Trend Line */}
              <path
                d={linePath}
                fill="none"
                stroke={activeMetric === 'revenue' ? 'var(--primary)' : 'var(--accent-vip)'}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Data points */}
              {points.map((pt) => {
                const isHovered = hoveredPoint?.index === pt.index;
                const strokeColor =
                  activeMetric === 'revenue' ? 'var(--primary)' : 'var(--accent-vip)';

                return (
                  <g
                    key={`pt-${pt.index}`}
                    onMouseEnter={() => setHoveredPoint(pt)}
                    style={{ cursor: 'pointer' }}
                  >
                    {/* Transparent larger hit area */}
                    <circle cx={pt.x} cy={pt.y} r="14" fill="transparent" />

                    {/* Visible dot */}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isHovered ? '6' : '3.5'}
                      fill="#ffffff"
                      stroke={strokeColor}
                      strokeWidth={isHovered ? '3' : '2'}
                      className="payment-point-circle"
                    />
                  </g>
                );
              })}

              {/* X-axis tick labels */}
              {xLabels.map((pt, idx) => (
                <text
                  key={`xlabel-${idx}`}
                  x={pt.x}
                  y={chartHeight - 12}
                  textAnchor="middle"
                  fill="var(--text-muted)"
                  fontSize="10"
                  fontFamily="var(--font-sans)"
                >
                  {pt.bucket.label}
                </text>
              ))}

              {/* Vertical crosshair on hover */}
              {hoveredPoint && (
                <line
                  x1={hoveredPoint.x}
                  y1={padding.top}
                  x2={hoveredPoint.x}
                  y2={chartHeight - padding.bottom}
                  stroke="var(--text-faint)"
                  strokeWidth="1"
                  strokeDasharray="2 2"
                  pointerEvents="none"
                />
              )}
            </svg>

            {/* Hover Tooltip HTML Overlay */}
            {hoveredPoint && (
              <div
                className="payment-chart-tooltip animate-fade-in"
                style={{
                  left: `${(hoveredPoint.x / chartWidth) * 100}%`,
                  top: `${(hoveredPoint.y / chartHeight) * 100}%`
                }}
              >
                <div className="tooltip-header">{hoveredPoint.bucket.fullDate}</div>
                <div className="tooltip-row">
                  <span className="tooltip-label">Revenue:</span>
                  <span className="tooltip-val" style={{ color: 'var(--success)' }}>
                    {formatCurrency(hoveredPoint.bucket.revenue)}
                  </span>
                </div>
                <div className="tooltip-row">
                  <span className="tooltip-label">Successful:</span>
                  <span className="tooltip-val">
                    {hoveredPoint.bucket.count}{' '}
                    {hoveredPoint.bucket.count === 1 ? 'payment' : 'payments'}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RevenueOverviewChart;
