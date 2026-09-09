export default function DecisionPlate({
  action,
  identity = action,
  label,
  metric,
  detail,
  image,
  index,
  selected = false,
  committed = false,
  disabled = false,
  onSelect,
}) {
  const state = disabled ? 'disabled' : committed ? 'committed' : selected ? 'selected' : 'ready';
  const descriptionId = `instant-action-${identity}-detail`;

  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-describedby={descriptionId}
      disabled={disabled}
      onClick={onSelect}
      className="instant-action-option caper-action-plate min-h-[136px] p-4 text-left"
      data-action={identity}
      data-state={state}
    >
      <span className="caper-action-tab" aria-hidden="true">
        {committed ? 'Sealed' : selected ? 'Selected' : `0${index + 1}`}
      </span>
      <span className="flex items-start justify-between gap-3">
        <span className="min-w-0">
          <span className="block font-display text-3xl uppercase text-vault-text">{label}</span>
          <span className="mt-2 block font-mono text-micro uppercase text-oxide-green">{metric}</span>
        </span>
        <span className="caper-action-art-frame" aria-hidden="true">
          <img
            src={image}
            alt=""
            width="512"
            height="512"
            className="instant-action-art h-14 w-14 object-contain"
          />
        </span>
      </span>
      <span id={descriptionId} className="instant-action-detail mt-3 block text-sm leading-5 text-vault-text-dim">
        {detail}
      </span>
      <span className="caper-action-confirm" aria-hidden="true">
        {committed ? 'Revealing' : selected ? 'Ready to commit' : 'Choose'}
      </span>
    </button>
  );
}
