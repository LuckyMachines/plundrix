import { CONTRACT_CONFIG_ERROR, IS_CONTRACT_CONFIGURED } from '../../config/contract';

export default function ContractConfigNotice() {
  if (IS_CONTRACT_CONFIGURED) return null;

  return (
    <div className="border border-signal-red/40 bg-signal-red/8 rounded px-4 py-3">
      <p className="font-mono text-[11px] text-signal-red tracking-wider uppercase">
        Contract Not Configured
      </p>
      <p className="font-mono text-xs text-vault-text-dim mt-1 leading-relaxed">
        {CONTRACT_CONFIG_ERROR}. Set <code>VITE_CONTRACT_ADDRESS</code> in{' '}
        <code>app/.env</code> and restart the Vite server.
      </p>
    </div>
  );
}
