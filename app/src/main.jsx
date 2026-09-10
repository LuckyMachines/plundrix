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
const Web3Provider = lazy(() => import('./components/wallet/Web3Provider'));

function RouteRuntime() {
  const { pathname } = useLocation();
  const web3Enabled = pathname === '/' || pathname === '/workshop' || pathname.startsWith('/game/');
  const dataEnabled = web3Enabled || pathname === '/sessions' || pathname === '/leaderboard' || pathname.startsWith('/profile/');
  const application = <App web3Enabled={web3Enabled} />;

  if (!dataEnabled) return application;
  return (
    <Suspense fallback={<div className="min-h-screen bg-vault-dark p-8 font-mono text-xs uppercase tracking-wider text-vault-text-dim">Loading live vault...</div>}>
      <DataProvider>
        {web3Enabled ? <Web3Provider>{application}</Web3Provider> : application}
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
