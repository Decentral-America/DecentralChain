/**
 * Performance Dashboard Component
 *
 * Visual dashboard for monitoring performance metrics in development
 */

import { useState } from 'react';
import { getPerformanceSummary, usePerformanceMetrics } from '@/hooks/usePerformanceMetrics';

export function PerformanceDashboard() {
  const [isOpen, setIsOpen] = useState(false);
  const { metrics, refresh, clear, isSupported } = usePerformanceMetrics({
    enableMemoryTracking: true,
    refreshInterval: 5000, // Refresh every 5 seconds
  });

  const summary = getPerformanceSummary(metrics);

  if (!isSupported) {
    return null;
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        style={{
          backgroundColor: '#007bff',
          border: 'none',
          borderRadius: '5px',
          bottom: '20px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
          color: 'white',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 'bold',
          padding: '10px 20px',
          position: 'fixed',
          right: '20px',
          zIndex: 10000,
        }}
      >
        📊 Performance
      </button>
    );
  }

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'good':
        return '#28a745';
      case 'needs-improvement':
        return '#ffc107';
      case 'poor':
        return '#dc3545';
      default:
        return '#6c757d';
    }
  };

  const formatValue = (value: number | null, unit: string = 'ms') => {
    if (value === null) return 'N/A';
    return `${value}${unit}`;
  };

  return (
    <div
      style={{
        backgroundColor: 'white',
        border: '1px solid #dee2e6',
        borderRadius: '8px',
        bottom: '20px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '600px',
        overflow: 'hidden',
        position: 'fixed',
        right: '20px',
        width: '400px',
        zIndex: 10000,
      }}
    >
      {/* Header */}
      <div
        style={{
          alignItems: 'center',
          backgroundColor: '#007bff',
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          padding: '15px',
        }}
      >
        <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: 0 }}>
          📊 Performance Dashboard
        </h3>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          style={{
            alignItems: 'center',
            background: 'none',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            display: 'flex',
            fontSize: '20px',
            height: '24px',
            justifyContent: 'center',
            padding: 0,
            width: '24px',
          }}
        >
          ×
        </button>
      </div>

      {/* Content */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '15px',
        }}
      >
        {/* Web Vitals */}
        <div style={{ marginBottom: '20px' }}>
          <h4 style={{ color: '#333', fontSize: '14px', margin: '0 0 10px 0' }}>Core Web Vitals</h4>

          <MetricRow
            label="LCP"
            value={formatValue(summary.lcp.value)}
            rating={summary.lcp.rating}
            getRatingColor={getRatingColor}
            description="Largest Contentful Paint"
          />

          <MetricRow
            label="CLS"
            value={formatValue(summary.cls.value, '')}
            rating={summary.cls.rating}
            getRatingColor={getRatingColor}
            description="Cumulative Layout Shift"
          />

          <MetricRow
            label="FCP"
            value={formatValue(summary.fcp.value)}
            rating={summary.fcp.rating}
            getRatingColor={getRatingColor}
            description="First Contentful Paint"
          />

          <MetricRow
            label="TTFB"
            value={formatValue(summary.ttfb.value)}
            rating={summary.ttfb.rating}
            getRatingColor={getRatingColor}
            description="Time to First Byte"
          />

          <MetricRow
            label="INP"
            value={formatValue(summary.inp.value)}
            rating={summary.inp.rating}
            getRatingColor={getRatingColor}
            description="Interaction to Next Paint"
          />
        </div>

        {/* Navigation Timing */}
        <div style={{ marginBottom: '20px' }}>
          <h4 style={{ color: '#333', fontSize: '14px', margin: '0 0 10px 0' }}>
            Navigation Timing
          </h4>

          <MetricRow
            label="Load Time"
            value={formatValue(metrics.loadTime)}
            rating={summary.loadTime.rating}
            getRatingColor={getRatingColor}
          />

          <MetricRow
            label="DOM Content Loaded"
            value={formatValue(metrics.domContentLoaded)}
            rating="good"
            getRatingColor={getRatingColor}
          />

          <MetricRow
            label="DOM Processing"
            value={formatValue(metrics.domProcessing)}
            rating="good"
            getRatingColor={getRatingColor}
          />
        </div>

        {/* Resource Timing */}
        <div style={{ marginBottom: '20px' }}>
          <h4 style={{ color: '#333', fontSize: '14px', margin: '0 0 10px 0' }}>Resource Timing</h4>

          <MetricRow
            label="Scripts"
            value={`${metrics.scriptCount} (${formatValue(metrics.scriptDuration)})`}
            rating="good"
            getRatingColor={getRatingColor}
          />

          <MetricRow
            label="Stylesheets"
            value={`${metrics.stylesheetCount} (${formatValue(metrics.stylesheetDuration)})`}
            rating="good"
            getRatingColor={getRatingColor}
          />

          <MetricRow
            label="Images"
            value={`${metrics.imageCount} (${formatValue(metrics.imageDuration)})`}
            rating="good"
            getRatingColor={getRatingColor}
          />
        </div>

        {/* Memory Usage */}
        {metrics.memoryUsage && (
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ color: '#333', fontSize: '14px', margin: '0 0 10px 0' }}>Memory Usage</h4>

            <MetricRow
              label="Used Heap"
              value={`${metrics.memoryUsage.usedJSHeapSize} MB`}
              rating="good"
              getRatingColor={getRatingColor}
            />

            <MetricRow
              label="Total Heap"
              value={`${metrics.memoryUsage.totalJSHeapSize} MB`}
              rating="good"
              getRatingColor={getRatingColor}
            />

            <MetricRow
              label="Heap Limit"
              value={`${metrics.memoryUsage.jsHeapSizeLimit} MB`}
              rating="good"
              getRatingColor={getRatingColor}
            />
          </div>
        )}

        {/* Custom Metrics */}
        <div>
          <h4 style={{ color: '#333', fontSize: '14px', margin: '0 0 10px 0' }}>Custom Metrics</h4>

          <MetricRow
            label="Component Renders"
            value={metrics.componentRenderCount.toString()}
            rating="good"
            getRatingColor={getRatingColor}
          />

          <MetricRow
            label="API Calls"
            value={metrics.apiCallCount.toString()}
            rating="good"
            getRatingColor={getRatingColor}
          />

          <MetricRow
            label="Route Changes"
            value={metrics.routeChangeCount.toString()}
            rating="good"
            getRatingColor={getRatingColor}
          />
        </div>
      </div>

      {/* Footer Actions */}
      <div
        style={{
          borderTop: '1px solid #dee2e6',
          display: 'flex',
          gap: '10px',
          padding: '15px',
        }}
      >
        <button
          type="button"
          onClick={refresh}
          style={{
            backgroundColor: '#28a745',
            border: 'none',
            borderRadius: '4px',
            color: 'white',
            cursor: 'pointer',
            flex: 1,
            fontSize: '14px',
            fontWeight: 'bold',
            padding: '8px',
          }}
        >
          🔄 Refresh
        </button>

        <button
          type="button"
          onClick={clear}
          style={{
            backgroundColor: '#dc3545',
            border: 'none',
            borderRadius: '4px',
            color: 'white',
            cursor: 'pointer',
            flex: 1,
            fontSize: '14px',
            fontWeight: 'bold',
            padding: '8px',
          }}
        >
          🗑️ Clear
        </button>
      </div>
    </div>
  );
}

interface MetricRowProps {
  label: string;
  value: string;
  rating: string;
  getRatingColor: (rating: string) => string;
  description?: string;
}

function MetricRow({ label, value, rating, getRatingColor, description }: MetricRowProps) {
  return (
    <div
      style={{
        alignItems: 'center',
        borderBottom: '1px solid #f0f0f0',
        display: 'flex',
        justifyContent: 'space-between',
        padding: '8px 0',
      }}
      title={description}
    >
      <span style={{ color: '#555', fontSize: '13px' }}>{label}</span>
      <div style={{ alignItems: 'center', display: 'flex', gap: '8px' }}>
        <span style={{ color: '#333', fontSize: '13px', fontWeight: 'bold' }}>{value}</span>
        <div
          style={{
            backgroundColor: getRatingColor(rating),
            borderRadius: '50%',
            height: '8px',
            width: '8px',
          }}
        />
      </div>
    </div>
  );
}
