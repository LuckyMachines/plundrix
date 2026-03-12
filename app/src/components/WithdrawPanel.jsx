import { useAccount, useReadContract } from 'wagmi';
import { formatEther } from 'viem';
import { PLUNDRIX_ABI, PLUNDRIX_ADDRESS, IS_CONTRACT_CONFIGURED } from '../config/contract';
import { useGameActions } from '../hooks/useGameActions';
import { useTxToast } from '../hooks/useTxToast';
import TxStatus from './shared/TxStatus';
import Spinner from './shared/Spinner';

export default function WithdrawPanel() {
  const { address } = useAccount();
  const { withdraw, hash, isPending, isConfirming, isSuccess, error } = useGameActions();
  useTxToast({ hash, isPending, isConfirming, isSuccess, error }, 'Withdrawal');

  const { data: balance, isLoading } = useReadContract({
    address: PLUNDRIX_ADDRESS,
    abi: PLUNDRIX_ABI,
    functionName: 'withdrawableBalance',
    args: [address],
    query: { enabled: !!address && IS_CONTRACT_CONFIGURED },
  });

  if (!address || !IS_CONTRACT_CONFIGURED) return null;
  if (isLoading) return null;
  if (!balance || balance === 0n) return null;

  return (
    <div className="border border-tungsten/30 rounded bg-vault-panel p-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-mono text-xs text-tungsten uppercase tracking-wider">
            Withdrawable Balance
          </h4>
          <p className="font-mono text-sm text-tungsten-bright mt-1">
            {formatEther(balance)} ETH
          </p>
        </div>
        <button
          onClick={() => withdraw()}
          disabled={isPending || isConfirming}
          className="px-4 py-2 bg-tungsten/10 border border-tungsten/40 rounded text-tungsten text-xs font-mono tracking-widest uppercase
                     hover:bg-tungsten/20 hover:border-tungsten/60 transition-colors
                     disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isPending || isConfirming ? (
            <span className="flex items-center gap-2">
              <Spinner size="w-3 h-3" /> Withdrawing...
            </span>
          ) : (
            'Withdraw'
          )}
        </button>
      </div>
      <TxStatus
        hash={hash}
        isPending={isPending}
        isConfirming={isConfirming}
        isSuccess={isSuccess}
        error={error}
      />
    </div>
  );
}
