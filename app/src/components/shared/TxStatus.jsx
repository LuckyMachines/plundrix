import { useEffect, useRef } from 'react';
import { emitPresentationCues } from '../../data/presentationDirector';

const STAGES = ['Sign', 'Seal', 'Final'];

export default function TxStatus({ hash, isPending, isConfirming, isSuccess, error }) {
  const lastCue = useRef('');
  const state = error ? 'error' : isSuccess ? 'success' : isConfirming ? 'network' : isPending ? 'wallet' : 'idle';
  const copy = {
    wallet: ['Authorizing the move', 'Your wallet holds the only signing key. Nothing has changed yet.'],
    network: ['Move sealed', 'Sepolia is etching the operation into its public ledger.'],
    success: ['Operation recorded', 'The vault ledger accepted this move as immutable proof.'],
    error: ['Seal rejected', 'No game action was changed. Review the reason and try again.'],
  }[state];
  const activeStage = state === 'wallet' ? 0 : state === 'network' ? 1 : 2;

  useEffect(() => {
    const cue = state === 'wallet' || state === 'network' ? 'tx.pending' : state === 'success' ? 'tx.confirmed' : '';
    if (!cue || lastCue.current === cue) return;
    lastCue.current = cue;
    emitPresentationCues([cue], { transactionState: state });
  }, [state]);

  if (!copy) return null;
  const truncateHash = (value) => value ? `${value.slice(0, 6)}...${value.slice(-4)}` : '';

  return (
    <section className="transaction-theater" data-state={state} role="status" aria-live="polite">
      <div className="transaction-theater__seal" aria-hidden="true"><i /><i /><span>{state === 'error' ? '!' : activeStage + 1}</span></div>
      <div className="transaction-theater__copy">
        <p>On-chain operation / {state}</p>
        <strong>{copy[0]}</strong>
        <small>{error ? error.shortMessage || error.message : copy[1]}</small>
        {hash && <code>Proof {truncateHash(hash)}</code>}
      </div>
      <ol className="transaction-theater__rail" aria-label="Transaction progress">
        {STAGES.map((label, index) => <li key={label} data-state={index < activeStage || state === 'success' ? 'complete' : index === activeStage ? 'active' : 'waiting'}><i />{label}</li>)}
      </ol>
    </section>
  );
}
