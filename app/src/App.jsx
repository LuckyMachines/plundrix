import { lazy, Suspense, useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import NetworkSwitchBanner from './components/wallet/NetworkSwitchBanner';
import Modal from './components/shared/Modal';
import Spinner from './components/shared/Spinner';
import SessionAudioBridge from './components/shared/SessionAudioBridge';
import HomePage from './pages/HomePage';

const InstantPlayPage = lazy(() => import('./pages/InstantPlayPage'));
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
const FieldManual = lazy(() => import('./components/help/FieldManual'));

export default function App() {
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
      <Header onHelpClick={() => setIsHelpOpen(true)} />
      <NetworkSwitchBanner />
      <main className="flex-1">
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
            <Route path="/" element={<HomePage />} />
            <Route path="/play" element={<InstantPlayPage />} />
            <Route path="/trailer" element={<TrailerPage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/sessions" element={<SessionsPage />} />
            <Route path="/profile/:address" element={<ProfilePage />} />
            <Route path="/game/:gameId" element={<GamePage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/snapshot" element={<SnapshotPage />} />
            <Route path="/simulator" element={<SimulatorPage />} />
            <Route path="/replays" element={<ReplaysPage />} />
            <Route path="/replay/:replayId" element={<ReplayPage />} />
            <Route path="/ops" element={<OpsPage />} />
            <Route path="/launch" element={<LaunchPage />} />
            <Route path="/ghosts" element={<GhostsPage />} />
            <Route path="/mutations" element={<MutationsPage />} />
            <Route path="/playtest" element={<PlaytestPage />} />
            <Route path="/design" element={<DesignTowerPage />} />
            <Route path="/compare" element={<CompareIndexPage />} />
            <Route path="/compare/:slug" element={<CompareDetailPage />} />
            <Route path="/glossary" element={<GlossaryPage />} />
            <Route path="/map" element={<ProductMapPage />} />
            <Route path="/design-system" element={<DesignSystemPage />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
      <SessionAudioBridge />
      <Modal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)}>
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
