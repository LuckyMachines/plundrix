import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import HomePage from './pages/HomePage';
import GamePage from './pages/GamePage';
import Modal from './components/shared/Modal';
import FieldManual from './components/help/FieldManual';

export default function App() {
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-[radial-gradient(circle_at_top,rgba(196,149,106,0.08),transparent_45%),linear-gradient(180deg,var(--color-vault-dark),#111214)]">
      <Header onHelpClick={() => setIsHelpOpen(true)} />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/game/:gameId" element={<GamePage />} />
        </Routes>
      </main>
      <Footer />
      <Modal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)}>
        <FieldManual />
      </Modal>
    </div>
  );
}
