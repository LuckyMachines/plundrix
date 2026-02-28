import { lazy, Suspense, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import Modal from './components/shared/Modal';
import Spinner from './components/shared/Spinner';

const HomePage = lazy(() => import('./pages/HomePage'));
const GamePage = lazy(() => import('./pages/GamePage'));
const FieldManual = lazy(() => import('./components/help/FieldManual'));

export default function App() {
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-[radial-gradient(circle_at_top,rgba(196,149,106,0.08),transparent_45%),linear-gradient(180deg,var(--color-vault-dark),#111214)]">
      <Header onHelpClick={() => setIsHelpOpen(true)} />
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
            <Route path="/game/:gameId" element={<GamePage />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
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
          <FieldManual />
        </Suspense>
      </Modal>
    </div>
  );
}
