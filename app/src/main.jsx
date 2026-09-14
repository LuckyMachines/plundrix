import React, { lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, useLocation } from 'react-router-dom';
import App from './App';
import { AccessibilityProvider } from './context/AccessibilityContext';
import { ToastProvider } from './context/ToastContext';
import AppErrorBoundary from './components/shared/AppErrorBoundary';
import { analyticsRoute, trackProductEvent } from './lib/analytics';
import './index.css';
import './styles/caper.css';

window.addEventListener('unhandledrejection', () => {
  trackProductEvent('Client Error', { source: 'unhandled-promise', surface: analyticsRoute(window.location.pathname) });
});

const DataProvider = lazy(() => import('./components/shared/DataProvider'));

function RouteRuntime() {
  const { pathname } = useLocation();
  const dataEnabled = pathname === '/' || pathname === '/workshop' || pathname.startsWith('/game/') || pathname === '/sessions' || pathname === '/leaderboard' || pathname.startsWith('/profile/');
  const application = <App />;

  if (!dataEnabled) return application;
  return (
    <Suspense fallback={<div className="min-h-screen bg-vault-dark p-8 font-mono text-xs uppercase tracking-wider text-vault-text-dim">Loading live vault...</div>}>
      <DataProvider>
        {application}
      </DataProvider>
    </Suspense>
  );
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AccessibilityProvider>
      <ToastProvider>
        <AppErrorBoundary>
          <BrowserRouter>
            <RouteRuntime />
          </BrowserRouter>
        </AppErrorBoundary>
      </ToastProvider>
    </AccessibilityProvider>
  </React.StrictMode>,
);
