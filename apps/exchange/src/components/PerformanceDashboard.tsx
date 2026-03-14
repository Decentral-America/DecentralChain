/**
 * Performance Dashboard Component
 *
 * Visual dashboard for monitoring performance metrics in development
 */

import { useState } from 'react';
import { usePerformanceMetrics, getPerformanceSummary } from '@/hooks/usePerformanceMetrics';

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
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          padding: '10px 20px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          zIndex: 10000,
          fontSize: '14px',
          fontWeight: 'bold',
          boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
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
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        width: '400px',
        maxHeight: '600px',
        backgroundColor: 'white',
        border: '1px solid #dee2e6',
        borderRadius: '8px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        zIndex: 10000,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '15px',
          backgroundColor: '#007bff',
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>
          📊 Performance Dashboard
        </h3>
        <button
          onClick={() => setIsOpen(false)}
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            fontSize: '20px',
            cursor: 'pointer',
            padding: 0,
            width: '24px',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ×
        </button>
      </div>

      {/* Content */}
      <div
        style={{
          padding: '15px',
          overflowY: 'auto',
          flex: 1,
        }}
      >
        {/* Web Vitals */}
        <div style={{ marginBottom: '20px' }}>
          <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#333' }}>Core Web Vitals</h4>

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
          <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#333' }}>
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
          <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#333' }}>Resource Timing</h4>

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
            <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#333' }}>Memory Usage</h4>

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
          <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#333' }}>Custom Metrics</h4>

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
          padding: '15px',
          borderTop: '1px solid #dee2e6',
          display: 'flex',
          gap: '10px',
        }}
      >
        <button
          onClick={refresh}
          style={{
            flex: 1,
            padding: '8px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold',
          }}
        >
          🔄 Refresh
        </button>

        <button
          onClick={clear}
          style={{
            flex: 1,
            padding: '8px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold',
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
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 0',
        borderBottom: '1px solid #f0f0f0',
      }}
      title={description}
    >
      <span style={{ fontSize: '13px', color: '#555' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#333' }}>{value}</span>
        <div
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: getRatingColor(rating),
          }}
        />
      </div>
    </div>
  );
}
