import { analyticsRoute, trackProductEvent } from './analytics.js';

const THRESHOLDS = Object.freeze({
  lcp: [2500, 4000],
  inp: [200, 500],
  cls: [0.1, 0.25],
});

export function performanceRating(metric, value) {
  const [good, poor] = THRESHOLDS[metric] || [0, 0];
  if (value <= good) return 'good';
  if (value <= poor) return 'needs-improvement';
  return 'poor';
}

export function performanceBucket(metric, value) {
  const numeric = Math.max(0, Number(value) || 0);
  if (metric === 'cls') {
    if (numeric <= 0.05) return '0-.05';
    if (numeric <= 0.1) return '.06-.10';
    if (numeric <= 0.25) return '.11-.25';
    return '.26+';
  }
  if (numeric <= 100) return '0-100ms';
  if (numeric <= 200) return '101-200ms';
  if (numeric <= 500) return '201-500ms';
  if (numeric <= 1000) return '501-1000ms';
  if (numeric <= 2500) return '1-2.5s';
  if (numeric <= 4000) return '2.5-4s';
  return '4s+';
}

export function startPerformanceTelemetry() {
  if (typeof window === 'undefined' || typeof PerformanceObserver === 'undefined') return () => {};

  let lcp = 0;
  let cls = 0;
  let inp = 0;
  let reported = false;
  const observers = [];
  const observe = (type, callback, options = { type, buffered: true }) => {
    try {
      const observer = new PerformanceObserver((list) => callback(list.getEntries()));
      observer.observe(options);
      observers.push(observer);
    } catch {
      // Unsupported performance entries are simply omitted.
    }
  };

  observe('largest-contentful-paint', (entries) => {
    const latest = entries.at(-1);
    if (latest) lcp = Math.max(lcp, latest.startTime);
  });
  observe('layout-shift', (entries) => {
    cls += entries.filter((entry) => !entry.hadRecentInput).reduce((sum, entry) => sum + entry.value, 0);
  });
  observe('event', (entries) => {
    for (const entry of entries) if (entry.interactionId) inp = Math.max(inp, entry.duration);
  }, { type: 'event', buffered: true, durationThreshold: 40 });

  const report = () => {
    if (reported) return;
    reported = true;
    const surface = analyticsRoute(window.location.pathname);
    for (const [metric, value] of Object.entries({ lcp, inp, cls })) {
      if (value <= 0 && metric !== 'cls') continue;
      trackProductEvent('Experience Vital', {
        surface,
        metric,
        rating: performanceRating(metric, value),
        value: performanceBucket(metric, value),
      });
    }
    observers.forEach((observer) => observer.disconnect());
  };

  const onVisibility = () => {
    if (document.visibilityState === 'hidden') report();
  };
  const timer = window.setTimeout(report, 12_000);
  document.addEventListener('visibilitychange', onVisibility, { once: true });
  window.addEventListener('pagehide', report, { once: true });

  return () => {
    window.clearTimeout(timer);
    document.removeEventListener('visibilitychange', onVisibility);
    window.removeEventListener('pagehide', report);
    observers.forEach((observer) => observer.disconnect());
  };
}
