import { useMemo } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import ReplayViewer from '../components/replay/ReplayViewer';
import {
  buildPairedReplayComparison,
  buildReplayFromSeed,
  loadReplayFromSearch,
} from '../lib/replayDirector';
import { replayGallerySeeds } from '../data/replayGallery';

export default function ReplayPage() {
  const { replayId } = useParams();
  const location = useLocation();
  const replay = useMemo(() => {
    if (location.search.includes('replay=')) {
      return loadReplayFromSearch(location.search);
    }
    const gallery = replayGallerySeeds.find((item) => item.id === replayId);
    return buildReplayFromSeed(gallery || replayGallerySeeds[0]);
  }, [location.search, replayId]);

  const comparison = useMemo(() => {
    if (!location.search.includes('compare=1')) return null;
    return buildPairedReplayComparison({
      seed: replay.seed,
      scenarioId: replay.scenarioId,
      strategies: replay.strategies,
      candidateRules: replay.rules,
    });
  }, [location.search, replay]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Link to="/replays" className="font-mono text-xs uppercase tracking-[0.14em] text-vault-text-dim hover:text-vault-text">
          Back to replay gallery
        </Link>
        <Link to={`/simulator${replay.shareUrl.split('/replay/' + replay.id)[1] || ''}`} className="font-mono text-xs uppercase tracking-[0.14em] text-oxide-green">
          Open in simulator
        </Link>
      </div>
      <ReplayViewer replay={replay} comparison={comparison} />
    </div>
  );
}
