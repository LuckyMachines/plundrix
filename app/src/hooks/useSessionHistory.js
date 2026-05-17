import { useEffect, useMemo, useRef, useState } from 'react';
import {
  appendSessionCueRecord,
  getSessionHistoryRecords,
  summarizeSessionHistory,
} from '../lib/sessionHistory';

export function useSessionHistory() {
  const [records, setRecords] = useState(() => getSessionHistoryRecords());

  useEffect(() => {
    const refresh = () => setRecords(getSessionHistoryRecords());
    window.addEventListener('storage', refresh);
    window.addEventListener('plundrix:session-history-updated', refresh);
    return () => {
      window.removeEventListener('storage', refresh);
      window.removeEventListener('plundrix:session-history-updated', refresh);
    };
  }, []);

  return useMemo(() => ({
    records,
    summary: summarizeSessionHistory(records),
  }), [records]);
}

export function useSessionHistoryRecorder(session) {
  const recordedRef = useRef(new Set());

  useEffect(() => {
    if (!session?.eventCues?.length) return;

    session.eventCues.forEach((cue) => {
      const key = `${session.gameId}:${cue.id}`;
      if (recordedRef.current.has(key)) return;
      recordedRef.current.add(key);
      appendSessionCueRecord({ session, cue });
    });
  }, [session]);
}
