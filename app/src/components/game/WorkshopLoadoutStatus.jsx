import { Link } from 'react-router-dom';
import { useAccount, useReadContract } from 'wagmi';
import {
  IS_WORKSHOP_CONFIGURED,
  PLUNDRIX_WORKSHOP_ABI,
  PLUNDRIX_WORKSHOP_ADDRESS,
} from '../../config/contract';
import { blueprintIdToGadgetId, getGadgetById } from '../../data/gadgetInventory';
import { GameState } from '../../lib/constants';
import { toGameId } from '../../lib/gameId';
import GadgetVisual from '../workshop/GadgetVisual';

export default function WorkshopLoadoutStatus({ gameId, gameState }) {
  const { address } = useAccount();
  const parsedGameId = toGameId(gameId);
  const isOpen = Number(gameState) === GameState.OPEN;
  const enabled = Boolean(address && IS_WORKSHOP_CONFIGURED);

  const currentRead = useReadContract({
    address: PLUNDRIX_WORKSHOP_ADDRESS,
    abi: PLUNDRIX_WORKSHOP_ABI,
    functionName: 'getWorkshopState',
    args: address ? [address] : undefined,
    query: { enabled: enabled && isOpen, refetchInterval: 10_000 },
  });
  const lockedRead = useReadContract({
    address: PLUNDRIX_WORKSHOP_ADDRESS,
    abi: PLUNDRIX_WORKSHOP_ABI,
    functionName: 'getGameLoadout',
    args: parsedGameId !== null && address ? [parsedGameId, address] : undefined,
    query: { enabled: enabled && !isOpen && parsedGameId !== null, refetchInterval: 5_000 },
  });

  if (!IS_WORKSHOP_CONFIGURED || !address) return null;

  const blueprintValue = isOpen ? currentRead.data?.[0] : lockedRead.data?.[0];
  const blueprintId = Number(blueprintValue || 0);
  const ready = isOpen ? blueprintId > 0 : Boolean(lockedRead.data?.[1]);
  const gadgetId = blueprintIdToGadgetId(blueprintId);
  const gadget = gadgetId ? getGadgetById(gadgetId) : null;

  return (
    <aside className="mb-5 flex min-h-[70px] items-center gap-4 border border-vault-border bg-vault-panel px-4 py-3" aria-label="Workshop loadout">
      {gadget ? <GadgetVisual gadget={gadget} compact className="h-14 min-h-14 w-14 shrink-0" /> : <div className="grid h-12 w-12 shrink-0 place-items-center border border-vault-border font-mono text-lg text-vault-text-dim">-</div>}
      <div className="min-w-0 flex-1">
        <p className="font-mono text-micro uppercase tracking-brand text-tungsten">{isOpen ? 'Next-match loadout' : 'Locked match loadout'}</p>
        <p className="mt-1 truncate font-display text-lg uppercase text-vault-text">{gadget?.name || 'No gadget equipped'}</p>
        <p className={`mt-1 font-mono text-micro uppercase tracking-interface ${ready ? 'text-oxide-green' : 'text-vault-text-dim'}`}>
          {gadget ? (ready ? `${gadget.protocolLabel} / armed` : `${gadget.protocolLabel} / consumed`) : 'This operation has no gadget protocol.'}
        </p>
      </div>
      {isOpen && <Link to="/workshop" className="shrink-0 border border-tungsten/40 px-3 py-2 font-mono text-micro uppercase tracking-interface text-tungsten hover:bg-tungsten/10">Change</Link>}
    </aside>
  );
}
