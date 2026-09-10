import { lazy, Suspense, useEffect, useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import Modal from './components/shared/Modal';
import Spinner from './components/shared/Spinner';
import SessionAudioBridge from './components/shared/SessionAudioBridge';
import Seo from './components/seo/Seo';
import { routeMeta } from './data/productSpine';
import { analyticsRoute, trackProductEvent } from './lib/analytics';

const PlayerHubPage = lazy(() => import('./pages/PlayerHubPage'));
const NetworkSwitchBanner = lazy(() => import('./components/wallet/NetworkSwitchBanner'));
const InstantPlayPage = lazy(() => import('./pages/InstantPlayPage'));
const VaultRunPage = lazy(() => import('./pages/VaultRunPage'));
const CareerPage = lazy(() => import('./pages/CareerPage'));
const WorkshopPage = lazy(() => import('./pages/WorkshopPage'));
const TrailerPage = lazy(() => import('./pages/TrailerPage'));
const GamePage = lazy(() => import('./pages/GamePage'));
const LeaderboardPage = lazy(() => import('./pages/LeaderboardPage'));
const SessionsPage = lazy(() => import('./pages/SessionsPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const TermsPage = lazy(() => import('./pages/TermsPage'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));
const SnapshotPage = lazy(() => import('./pages/SnapshotPage'));
const SimulatorPage = lazy(() => import('./pages/SimulatorPage'));
const ReplaysPage = lazy(() => import('./pages/ReplaysPage'));
const ReplayPage = lazy(() => import('./pages/ReplayPage'));
const OpsPage = lazy(() => import('./pages/OpsPage'));
const LaunchPage = lazy(() => import('./pages/LaunchPage'));
const GhostsPage = lazy(() => import('./pages/GhostsPage'));
const MutationsPage = lazy(() => import('./pages/MutationsPage'));
const PlaytestPage = lazy(() => import('./pages/PlaytestPage'));
const DesignTowerPage = lazy(() => import('./pages/DesignTowerPage'));
const CompareIndexPage = lazy(() => import('./pages/CompareIndexPage'));
const CompareDetailPage = lazy(() => import('./pages/CompareDetailPage'));
const GlossaryPage = lazy(() => import('./pages/GlossaryPage'));
const ProductMapPage = lazy(() => import('./pages/ProductMapPage'));
const DesignSystemPage = lazy(() => import('./pages/DesignSystemPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const FieldManual = lazy(() => import('./components/help/FieldManual'));
const INTERNAL_TOOLS_ENABLED = import.meta.env.DEV || import.meta.env.VITE_ENABLE_INTERNAL_TOOLS === 'true';

export default function App({ web3Enabled = false }) {
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [helpInitialTab, setHelpInitialTab] = useState('overview');

  useEffect(() => {
    const onOpenHelp = (event) => {
      setHelpInitialTab(event.detail?.tab || 'overview');
      setIsHelpOpen(true);
    };
    window.addEventListener('plundrix:open-help', onOpenHelp);
    return () => window.removeEventListener('plundrix:open-help', onOpenHelp);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[radial-gradient(circle_at_top,rgba(196,149,106,0.08),transparent_45%),linear-gradient(180deg,var(--color-vault-dark),#111214)]">
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <RouteMetadata />
      <ScrollToTop />
      <RouteAnalytics />
      <Header onHelpClick={() => setIsHelpOpen(true)} web3Enabled={web3Enabled} />
      {web3Enabled && <Suspense fallback={null}><NetworkSwitchBanner /></Suspense>}
      <main className="min-w-0 flex-1" id="main-content" tabIndex="-1">
        <Suspense
          fallback={
            <div className="max-w-6xl mx-auto px-6 py-10 flex items-center gap-3">
              <Spinner size="w-5 h-5" />
              <span className="font-mono text-xs text-vault-text-dim uppercase tracking-wider">
                Loading interface...
              </span>
            </div>
          }
        >
          <Routes>
            <Route path="/" element={<PlayerHubPage />} />
            <Route path="/play" element={<InstantPlayPage />} />
            <Route path="/vault-run" element={<VaultRunPage />} />
            <Route path="/career" element={<CareerPage />} />
            <Route path="/workshop" element={<WorkshopPage />} />
            <Route path="/trailer" element={<TrailerPage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/sessions" element={<SessionsPage />} />
            <Route path="/profile/:address" element={<ProfilePage />} />
            <Route path="/game/:gameId" element={<GamePage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/replays" element={<ReplaysPage />} />
            <Route path="/replay/:replayId" element={<ReplayPage />} />
            <Route path="/compare" element={<CompareIndexPage />} />
            <Route path="/compare/:slug" element={<CompareDetailPage />} />
            <Route path="/glossary" element={<GlossaryPage />} />
            {INTERNAL_TOOLS_ENABLED && (
              <>
                <Route path="/snapshot" element={<SnapshotPage />} />
                <Route path="/simulator" element={<SimulatorPage />} />
                <Route path="/ops" element={<OpsPage />} />
                <Route path="/launch" element={<LaunchPage />} />
                <Route path="/ghosts" element={<GhostsPage />} />
                <Route path="/mutations" element={<MutationsPage />} />
                <Route path="/playtest" element={<PlaytestPage />} />
                <Route path="/design" element={<DesignTowerPage />} />
                <Route path="/map" element={<ProductMapPage />} />
                <Route path="/design-system" element={<DesignSystemPage />} />
              </>
            )}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </main>
      <Footer web3Enabled={web3Enabled} />
      <SessionAudioBridge />
      <Modal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} ariaLabel="Plundrix field manual">
        <Suspense
          fallback={
            <div className="p-8 flex items-center gap-3">
              <Spinner size="w-5 h-5" />
              <span className="font-mono text-xs text-vault-text-dim uppercase tracking-wider">
                Loading field manual...
              </span>
            </div>
          }
        >
          <FieldManual initialTab={helpInitialTab} />
        </Suspense>
      </Modal>
    </div>
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);

  return null;
}

function RouteAnalytics() {
  const { pathname } = useLocation();

  useEffect(() => {
    trackProductEvent('Page Viewed', { surface: analyticsRoute(pathname) });
  }, [pathname]);

  return null;
}

function RouteMetadata() {
  const { pathname } = useLocation();
  if (pathname === '/' || pathname === '/play' || pathname === '/vault-run' || pathname === '/trailer' || pathname.startsWith('/compare')) {
    return null;
  }

  let metaPath = pathname;
  let noIndex = false;
  if (pathname.startsWith('/game/')) {
    metaPath = '/game/:gameId';
    noIndex = true;
  } else if (pathname.startsWith('/profile/')) {
    metaPath = '/profile/:address';
    noIndex = true;
  } else if (pathname.startsWith('/replay/')) {
    metaPath = '/replay/:replayId';
    noIndex = true;
  }

  const meta = routeMeta(metaPath);
  if (!meta || (meta.public === false && !INTERNAL_TOOLS_ENABLED)) {
    return <Seo title="Page Not Found | Plundrix" description="This Plundrix route does not exist." path={pathname} noIndex />;
  }

  return (
    <Seo
      title={meta.title}
      description={meta.description}
      path={pathname}
      image={meta.image}
      noIndex={noIndex || meta.public === false}
    />
  );
}
