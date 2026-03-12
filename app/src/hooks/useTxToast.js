import { useEffect, useRef } from 'react';
import { useToast } from '../context/ToastContext';

/**
 * Watches transaction lifecycle and fires toast notifications.
 * Pass the same { hash, isPending, isConfirming, isSuccess, error } from useGameActions.
 */
export function useTxToast({ hash, isPending, isConfirming, isSuccess, error }, label = 'Transaction') {
  const toast = useToast();
  const lastHash = useRef(null);
  const shownSuccess = useRef(null);
  const shownError = useRef(null);

  useEffect(() => {
    if (isSuccess && hash && shownSuccess.current !== hash) {
      shownSuccess.current = hash;
      const short = `${hash.slice(0, 6)}...${hash.slice(-4)}`;
      toast.success(`${label} confirmed`, {
        title: 'Confirmed',
        duration: 4000,
      });
    }
  }, [isSuccess, hash, label, toast]);

  useEffect(() => {
    if (error && shownError.current !== error) {
      shownError.current = error;
      toast.error(error.shortMessage || error.message || 'Unknown error', {
        title: `${label} failed`,
        duration: 8000,
      });
    }
  }, [error, label, toast]);
}
