import { useEffect, useMemo } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import ReplayViewer from '../components/replay/ReplayViewer';
import NotFoundPage from './NotFoundPage';
import {
  buildPairedReplayComparison,
  buildReplayFromSeed,
  findReplayInLibrary,
  loadReplayFromSearch,
} from '../lib/replayDirector';
import { replayGallerySeeds } from '../data/replayGallery';
import { trackProductEvent } from '../lib/analytics';

export default function ReplayPage() {
  const { replayId } = useParams();
  const location = useLocation();
  const replay = useMemo(() => {
    if (location.search.includes('replay=')) {
      return loadReplayFromSearch(location.search);
    }
    const saved = findReplayInLibrary(replayId);
    if (saved) return saved;
    const gallery = replayGallerySeeds.find((item) => item.id === replayId);
    return gallery ? buildReplayFromSeed(gallery) : null;
  }, [location.search, replayId]);

  const comparison = useMemo(() => {
    if (!replay || !location.search.includes('compare=1')) return null;
    return buildPairedReplayComparison({
      seed: replay.seed,
      scenarioId: replay.scenarioId,
      strategies: replay.strategies,
      candidateRules: replay.rules,
    });
  }, [location.search, replay]);

  useEffect(() => {
    if (replay) trackProductEvent('Replay Viewed', { source: replay.sourceType || 'gallery' });
  }, [replay]);

  if (!replay) return <NotFoundPage />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Link to="/replays" className="font-mono text-xs uppercase tracking-label text-vault-text-dim hover:text-vault-text">
          Back to replay gallery
        </Link>
        <Link to="/play" className="font-mono text-xs uppercase tracking-label text-oxide-green">
          Play this kind of match
        </Link>
      </div>
      <ReplayViewer replay={replay} comparison={comparison} />
    </div>
  );
}
