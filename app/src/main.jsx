import React, { lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, useLocation } from 'react-router-dom';
import App from './App';
import { AccessibilityProvider } from './context/AccessibilityContext';
import { ToastProvider } from './context/ToastContext';
import AppErrorBoundary from './components/shared/AppErrorBoundary';
import { ActionWaitPanel } from './components/shared/ActionFeedback';
import { analyticsRoute, trackProductEvent } from './lib/analytics';
import { startPerformanceTelemetry } from './lib/performanceTelemetry';
import './index.css';
import './styles/caper.css';

window.addEventListener('unhandledrejection', () => {
  trackProductEvent('Client Error', { source: 'unhandled-promise', surface: analyticsRoute(window.location.pathname) });
});

startPerformanceTelemetry();

const DataProvider = lazy(() => import('./components/shared/DataProvider'));

function RouteRuntime() {
  const { pathname } = useLocation();
  const dataEnabled = pathname === '/' || pathname === '/workshop' || pathname.startsWith('/game/') || pathname === '/sessions' || pathname === '/leaderboard' || pathname.startsWith('/profile/');
  const application = <App />;

  if (!dataEnabled) return application;
  return (
    <Suspense fallback={<div className="min-h-screen bg-vault-dark p-8"><div className="mx-auto max-w-4xl pt-20"><ActionWaitPanel eyebrow="Opening Plundrix" detail="Starting the game service and restoring your saved state." /></div></div>}>
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
