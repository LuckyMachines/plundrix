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
          <g className="caper-route-map__rooms">
            <rect x="62" y="78" width="78" height="54" rx="4" />
            <rect x="152" y="56" width="94" height="72" rx="4" />
            <rect x="84" y="158" width="112" height="68" rx="4" />
            <rect x="214" y="142" width="72" height="92" rx="4" />
            <rect x="54" y="264" width="94" height="76" rx="4" />
            <rect x="164" y="286" width="110" height="66" rx="4" />
            <rect x="488" y="66" width="92" height="68" rx="4" />
            <rect x="594" y="92" width="94" height="76" rx="4" />
            <rect x="518" y="176" width="132" height="66" rx="4" />
            <rect x="590" y="270" width="106" height="72" rx="4" />
            <rect x="478" y="326" width="94" height="68" rx="4" />
            <path d="M96 105h18v14H96zm98-19h26v18h-26zM111 184h44v16h-44zm128-10h22v34h-22zM80 294h42v18H80zm112 18h54v16h-54zM514 92h38v18h-38zm110 28h36v20h-36zm-74 82h72v16h-72zm72 96h46v18h-46zm-116 54h38v18h-38z" />
          </g>
          <path className="caper-route-map__service-lines" d="M140 104h12m94-12h38v62m-88 38h18m-66 110h16m110 18h42M488 100h-54v66m146-36h14m56 78h34m-94 98h-42v46m-70 8h-50" />
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
