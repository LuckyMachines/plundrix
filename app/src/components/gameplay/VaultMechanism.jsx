export default function VaultMechanism({
  cracked = 0,
  total = 5,
  resolving = false,
  label = 'Your vault',
  selectedAction = 'pick',
}) {
  const remaining = Math.max(0, total - cracked);

  return (
    <div className="instant-vault-core caper-layer caper-layer-planning relative overflow-hidden text-center" data-route={selectedAction}>
      <div className="caper-route-map" aria-hidden="true">
        <svg viewBox="0 0 760 500" preserveAspectRatio="none" focusable="false">
          <path className="caper-route-map__architecture" d="M70 70h150v55h72v82h-88v83H88v102h188m208-312h178v90h-84v92h112v108H548v74H430" />
          <path className="caper-route-map__line caper-route-map__line-pick" d="M28 410 C 150 392, 158 286, 286 310 S 424 244, 545 282 S 646 176, 728 84" />
          <path className="caper-route-map__line caper-route-map__line-search" d="M20 96 C 150 80, 176 188, 302 182 S 474 104, 726 214" />
          <path className="caper-route-map__line caper-route-map__line-sabotage" d="M52 260 C 168 238, 234 400, 382 350 S 578 404, 724 332" />
          {[['72','394'],['166','340'],['286','310'],['445','262'],['545','282'],['664','190'],['120','98'],['302','182'],['596','138'],['216','346'],['382','350'],['610','388']].map(([cx, cy], index) => <circle key={index} cx={cx} cy={cy} r="7" />)}
        </svg>
      </div>

      <div className="instant-vault-title">
        <p className="caper-kicker font-mono text-xs uppercase tracking-brand text-tungsten">{label}</p>
        <span>{remaining === 0 ? 'Breach open' : `${remaining} sealed`}</span>
      </div>
      <div className="instant-vault-machine">
        <div className="instant-vault-heart" aria-hidden="true">
          <i /><i /><i /><span />
        </div>
        <div
          className="instant-lock-rack"
          role="img"
          aria-label={`${cracked} of ${total} locks cracked`}
        >
          {Array.from({ length: total }, (_, index) => {
            const open = index < cracked;
            return (
              <span
                key={index}
                className={`instant-lock ${open ? 'instant-lock-cracked' : ''}`}
                data-state={open ? 'open' : 'sealed'}
                aria-hidden="true"
              >
                <span className="instant-lock__index">{index + 1}</span>
                <span className="instant-lock__keyway" />
                <span className="instant-lock__state">{open ? 'Open' : 'Sealed'}</span>
              </span>
            );
          })}
        </div>
      </div>

      <p className="instant-vault-copy text-sm text-vault-text-dim">
        {remaining === 0
          ? 'The final lock is open.'
          : `Crack ${remaining} more ${remaining === 1 ? 'lock' : 'locks'} before the table.`}
      </p>
      {resolving && (
        <p className="mt-2 font-mono text-xs uppercase tracking-brand text-tungsten" role="status">
          Actions sealed. Revealing...
        </p>
      )}
    </div>
  );
}
