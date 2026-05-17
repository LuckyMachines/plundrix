import {
  findInterestingSeeds,
  runAutopilotSearch,
} from '../lib/balanceAutopilot.js';
import { addReplayDirectorScoresToAutopilotReport } from '../lib/replayDirector.js';

self.onmessage = (event) => {
  const { type, payload } = event.data || {};

  try {
    if (type === 'find-seeds') {
      const seeds = findInterestingSeeds(payload || {});
      self.postMessage({ type: 'seeds', payload: seeds });
      return;
    }

    if (type === 'start') {
      const report = addReplayDirectorScoresToAutopilotReport(runAutopilotSearch({
        ...(payload || {}),
        environment: 'browser',
        onProgress: (progress) => {
          self.postMessage({ type: 'progress', payload: progress });
        },
      }));
      self.postMessage({ type: 'complete', payload: report });
      return;
    }

    self.postMessage({ type: 'error', payload: `Unknown worker message: ${type}` });
  } catch (error) {
    self.postMessage({
      type: 'error',
      payload: error instanceof Error ? error.message : String(error),
    });
  }
};
