import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Seo from '../components/seo/Seo';
import GadgetVisual from '../components/workshop/GadgetVisual';
import {
  CALIBRATIONS,
  CRAFTING_MATERIALS,
  GADGET_BLUEPRINT_COUNT,
  GADGET_CATALOG,
  GADGET_CHASSIS,
  HERO_BUILDS,
  MATERIAL_FINISHES,
  STARTER_GADGET_IDS,
  getGadgetById,
  getGadgetConfiguration,
} from '../data/gadgetInventory';
import {
  canCraftGadget,
  craftGadgetState,
  dismantleGadgetState,
  equipGadgetState,
  getGadgetMastery,
  readInventory,
  toggleFavoriteGadgetState,
  writeInventory,
} from '../lib/inventoryStore';
import { trackProductEvent } from '../lib/analytics';
import { useWorkshopContract } from '../hooks/useWorkshopContract';

const RARITY_TONES = {
  field: 'border-vault-border text-vault-text-dim',
  tuned: 'border-blueprint/60 text-[#79AEE9]',
  rare: 'border-oxide-green/60 text-oxide-green',
  masterwork: 'border-tungsten/70 text-tungsten-bright',
};

const EMPTY_ONCHAIN_INVENTORY = Object.freeze({
  ownedIds: STARTER_GADGET_IDS,
  equippedId: null,
  craftedCount: 0,
  materials: Object.freeze(Object.fromEntries(CRAFTING_MATERIALS.map((material) => [material.id, 0]))),
});

function selectFromGadget(gadget, setters) {
  setters.setChassis(gadget.chassisId);
  setters.setFinish(gadget.finishId);
  setters.setCalibration(gadget.calibrationId);
}

export default function WorkshopPage() {
  const [localInventory, setLocalInventory] = useState(readInventory);
  const workshop = useWorkshopContract();
  const onchainMode = workshop.isConnected && workshop.isConfigured;
  const onchainReady = onchainMode && workshop.isLinked;
  const chainInventory = workshop.inventory || EMPTY_ONCHAIN_INVENTORY;
  const inventory = onchainMode ? { ...chainInventory, favoriteIds: localInventory.favoriteIds || [] } : localInventory;
  const equipped = inventory.equippedId ? getGadgetById(inventory.equippedId) : null;
  const [chassisId, setChassis] = useState(equipped?.chassisId || GADGET_CHASSIS[0].id);
  const [finishId, setFinish] = useState(equipped?.finishId || MATERIAL_FINISHES[0].id);
  const [calibrationId, setCalibration] = useState(equipped?.calibrationId || CALIBRATIONS[0].id);
  const [protocolFilter, setProtocolFilter] = useState('all');
  const [lookup, setLookup] = useState('');
  const [compareIds, setCompareIds] = useState([]);
  const [status, setStatus] = useState('Choose a chassis, then make its material and calibration your own.');
  const selected = useMemo(() => getGadgetConfiguration(chassisId, finishId, calibrationId), [calibrationId, chassisId, finishId]);
  const materialById = useMemo(() => Object.fromEntries(CRAFTING_MATERIALS.map((material) => [material.id, material])), []);
  const favoriteIds = inventory.favoriteIds || [];
  const selectedOwned = inventory.ownedIds.includes(selected.id);
  const selectedCraftable = canCraftGadget(inventory, selected);
  const transactionPending = Boolean(workshop.pendingAction) || (onchainMode && !onchainReady);
  const selectedMastery = getGadgetMastery(localInventory, selected.chassisId);
  const equippedMastery = equipped ? getGadgetMastery(localInventory, equipped.chassisId) : null;
  const setters = { setChassis, setFinish, setCalibration };

  const families = useMemo(() => GADGET_CHASSIS.filter((chassis) => (
    protocolFilter === 'all' || chassis.protocol === protocolFilter
  )), [protocolFilter]);

  const familyProgress = useMemo(() => Object.fromEntries(GADGET_CHASSIS.map((chassis) => [
    chassis.id,
    inventory.ownedIds.filter((id) => getGadgetById(id).chassisId === chassis.id).length,
  ])), [inventory.ownedIds]);

  const lookupMatches = useMemo(() => {
    const query = lookup.trim().toLowerCase();
    if (!query) return [];
    return GADGET_CATALOG.filter((gadget) => [
      gadget.serial, gadget.name, gadget.chassisLabel, gadget.finishLabel, gadget.calibrationLabel,
    ].some((value) => value.toLowerCase().includes(query))).slice(0, 8);
  }, [lookup]);

  const compareGadgets = compareIds.map(getGadgetById);

  const commitInventory = (next) => {
    const stored = writeInventory(next);
    setLocalInventory(stored);
    window.dispatchEvent(new CustomEvent('plundrix:inventory-changed', { detail: stored }));
  };

  const selectGadget = (gadget, scroll = true) => {
    selectFromGadget(gadget, setters);
    setLookup('');
    if (scroll) requestAnimationFrame(() => document.querySelector('#builder')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  const craft = async () => {
    if (onchainMode) {
      setStatus(`Confirm assembly of ${selected.name} in your wallet.`);
      try {
        await workshop.craftBlueprint(selected.id);
        setStatus(`${selected.name} assembled onchain. It is ready to equip.`);
        trackProductEvent('Gadget Crafted', { chassis: selected.chassisId, rarity: selected.rarity, mode: 'onchain' });
      } catch (error) {
        setStatus(error.shortMessage || error.message || 'Onchain assembly failed.');
      }
      return;
    }
    const result = craftGadgetState(inventory, selected.id);
    if (result.ok) {
      commitInventory(result.next);
      trackProductEvent('Gadget Crafted', { chassis: selected.chassisId, rarity: selected.rarity, mode: 'local' });
    }
    setStatus(result.message);
  };

  const equip = async () => {
    if (onchainMode) {
      setStatus(`Confirm ${selected.name} as your next match loadout.`);
      try {
        await workshop.equipBlueprint(selected.id);
        setStatus(`${selected.name} equipped onchain. Its ${selected.effectName} signature will lock at match start.`);
        trackProductEvent('Gadget Equipped', { chassis: selected.chassisId, protocol: selected.protocol, mode: 'onchain' });
      } catch (error) {
        setStatus(error.shortMessage || error.message || 'Onchain equip failed.');
      }
      return;
    }
    const result = equipGadgetState(inventory, selected.id);
    if (result.ok) commitInventory(result.next);
    setStatus(result.message);
  };

  const reclaim = async () => {
    if (!window.confirm(`Reclaim ${selected.name}? Half of each recipe material will return to your locker.`)) return;
    if (onchainMode) {
      setStatus(`Confirm reclamation of ${selected.name} in your wallet.`);
      try {
        await workshop.reclaimBlueprint(selected.id);
        setStatus(`${selected.name} reclaimed onchain. Half its salvage returned.`);
      } catch (error) {
        setStatus(error.shortMessage || error.message || 'Onchain reclamation failed.');
      }
      return;
    }
    const result = dismantleGadgetState(inventory, selected.id);
    if (result.ok) commitInventory(result.next);
    setStatus(result.message);
  };

  const toggleFavorite = () => {
    const next = toggleFavoriteGadgetState(localInventory, selected.id);
    commitInventory(next);
    setStatus(next.favoriteIds.includes(selected.id) ? `${selected.name} saved to favorites.` : `${selected.name} removed from favorites.`);
  };

  const toggleCompare = () => {
    setCompareIds((current) => {
      if (current.includes(selected.id)) return current.filter((id) => id !== selected.id);
      return [...current.slice(-1), selected.id];
    });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
      <Seo
        title="Operator Workshop - 10 Signature Gadgets, 1,200 Builds | Plundrix"
        description="Choose one of ten gameplay-distinct Plundrix gadgets, then configure its finish and calibration across 1,200 stable blueprints."
        path="/workshop"
        image="/images/og/plundrix-play.jpg"
      />

      <section className="relative overflow-hidden border border-vault-border bg-vault-surface">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(196,149,106,0.17),transparent_32%),linear-gradient(135deg,rgba(58,124,196,0.08),transparent_45%)]" />
        <div className="relative grid gap-8 p-6 sm:p-9 lg:grid-cols-[minmax(0,1fr)_390px] lg:p-12">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <p className="font-mono text-xs uppercase tracking-[0.24em] text-oxide-green">Operator workshop</p>
              <span className={`border px-2 py-1 font-mono text-xs uppercase tracking-[0.12em] ${onchainMode ? 'border-oxide-green/50 text-oxide-green' : 'border-blueprint/50 text-[#79AEE9]'}`}>
                {onchainReady ? 'Onchain collection' : onchainMode ? 'Checking onchain link' : 'Local practice collection'}
              </span>
            </div>
            <h1 className="mt-4 max-w-4xl font-display text-5xl font-bold uppercase leading-[0.88] text-vault-text sm:text-7xl">Ten signature gadgets. Your build.</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-vault-text-dim">
              Choose a gameplay-distinct chassis, then shape its appearance with ten material finishes and twelve visible calibration modules. That creates <strong className="font-normal text-tungsten-bright">{GADGET_BLUEPRINT_COUNT.toLocaleString()} stable configurations</strong> without pretending they are 1,200 different inventions.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href="#families" className="inline-flex min-h-[50px] items-center bg-tungsten-bright px-6 font-mono text-xs font-semibold uppercase tracking-[0.14em] text-vault-dark">Choose a chassis</a>
              <Link to={onchainMode ? '/' : '/play?mode=tactical'} className="inline-flex min-h-[50px] items-center border border-tungsten/50 px-5 font-mono text-xs uppercase tracking-[0.14em] text-tungsten">{onchainMode ? 'Enter live vault' : 'Test equipped build'}</Link>
            </div>
          </div>

          <article className="border border-tungsten/45 bg-vault-dark/80 p-4">
            <p className="label text-tungsten">Equipped configuration</p>
            {equipped ? <>
              <GadgetVisual gadget={equipped} masteryLevel={equippedMastery.level} className="mt-3 min-h-[210px]" />
              <div className="mt-4 flex items-start justify-between gap-3"><div><h2 className="font-display text-2xl uppercase text-vault-text">{equipped.name}</h2><p className="mt-1 text-sm text-vault-text-dim">{equipped.effectName}: {equipped.protocolLabel}</p></div><span className="font-mono text-xs text-vault-text-dim">{equipped.serial}</span></div>
              <div className="mt-4 border-t border-vault-border pt-4"><div className="flex items-center justify-between gap-3"><p className="font-mono text-[9px] uppercase tracking-[.14em] text-oxide-green">Device mastery {equippedMastery.level} / {equippedMastery.title}</p><span className="font-mono text-[9px] text-vault-text-dim">{equippedMastery.xp} XP</span></div><div className="mt-2 h-1.5 bg-vault-surface"><div className="h-full bg-oxide-green" style={{ width: `${equippedMastery.progress}%` }} /></div></div>
            </> : <div className="grid min-h-[250px] place-content-center text-center"><h2 className="font-display text-3xl uppercase text-vault-text">No build equipped</h2><p className="mt-3 text-sm text-vault-text-dim">Choose one below.</p></div>}
          </article>
        </div>
      </section>

      <section className="mt-6 border border-vault-border bg-vault-surface p-5 sm:p-7" aria-labelledby="salvage-heading">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div><p className="label text-tungsten">Salvage locker</p><h2 id="salvage-heading" className="mt-2 font-display text-3xl uppercase text-vault-text">Materials with a visible purpose</h2></div>
          <p className="font-mono text-xs uppercase text-vault-text-dim">{workshop.isLoading && onchainMode ? 'Reading chain...' : `${inventory.craftedCount} custom builds assembled`}</p>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">
          {CRAFTING_MATERIALS.map((material) => (
            <article key={material.id} className="grid min-w-0 grid-cols-[52px_minmax(0,1fr)] items-center gap-3 border border-vault-border bg-vault-dark/45 p-3">
              <img src={material.image} alt="" width="512" height="512" className="h-13 w-13 object-contain" />
              <div className="min-w-0"><p className="truncate font-display uppercase text-vault-text">{material.label}</p><p className="mt-1 font-mono text-lg text-tungsten-bright">{inventory.materials[material.id]}</p></div>
            </article>
          ))}
        </div>
      </section>

      <section id="families" className="mt-6 scroll-mt-24 border border-vault-border bg-vault-surface p-5 sm:p-7">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div><p className="label text-tungsten">Step 1 / Gameplay</p><h2 className="mt-2 font-display text-4xl uppercase text-vault-text">Choose a signature chassis</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-vault-text-dim">The chassis determines the live match effect. Finish, calibration, and rarity never hide extra power.</p></div>
          <div className="flex flex-wrap gap-2" aria-label="Filter chassis by protocol">
            {[['all', 'All 10'], ['precision-kit', 'Pick'], ['signal-scanner', 'Search'], ['firewall', 'Guard']].map(([id, label]) => <button key={id} type="button" aria-pressed={protocolFilter === id} onClick={() => setProtocolFilter(id)} className={`min-h-[44px] border px-4 font-mono text-xs uppercase ${protocolFilter === id ? 'border-oxide-green bg-oxide-green/10 text-oxide-green' : 'border-vault-border text-vault-text-dim'}`}>{label}</button>)}
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {families.map((chassis) => {
            const preview = getGadgetConfiguration(chassis.id, finishId, calibrationId);
            const active = chassis.id === chassisId;
            return <article key={chassis.id} className={`flex flex-col border p-3 ${active ? 'border-tungsten bg-tungsten/8' : 'border-vault-border bg-vault-dark/35'}`}>
              <GadgetVisual gadget={preview} compact />
              <p className="mt-3 font-mono text-xs uppercase text-oxide-green">{chassis.protocol === 'precision-kit' ? 'Pick' : chassis.protocol === 'signal-scanner' ? 'Search' : 'Guard'} / {familyProgress[chassis.id]} of 120</p>
              <h3 className="mt-2 font-display text-2xl uppercase text-vault-text">{chassis.label}</h3>
              <p className="mt-2 text-sm leading-5 text-vault-text-dim">{chassis.effect}</p>
              <button type="button" onClick={() => selectGadget(preview)} className={`mt-auto min-h-[44px] pt-4 font-mono text-xs uppercase ${active ? 'text-oxide-green' : 'text-tungsten'}`}>{active ? 'Editing this chassis' : 'Customize chassis ->'}</button>
            </article>;
          })}
        </div>
      </section>

      <section id="builder" className="mt-6 scroll-mt-24 border border-vault-border bg-vault-surface p-5 sm:p-7" aria-labelledby="builder-heading">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div><p className="label text-tungsten">Steps 2-3 / Appearance</p><h2 id="builder-heading" className="mt-2 font-display text-4xl uppercase text-vault-text">Build your configuration</h2></div>
          <div className="flex items-center gap-2"><span className={`border px-2 py-1 font-mono text-xs uppercase ${RARITY_TONES[selected.rarity]}`}>{selected.rarityLabel}</span><span className="font-mono text-xs text-vault-text-dim">{selected.serial}</span></div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(320px,0.8fr)_minmax(0,1.2fr)]">
          <div>
            <GadgetVisual gadget={selected} masteryLevel={selectedMastery.level} className="min-h-[360px]" />
            <div className="border border-t-0 border-vault-border bg-vault-dark/55 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-mono text-xs uppercase text-oxide-green">{selected.protocolFamilyLabel} family / {selected.role}</p><h3 className="mt-2 font-display text-4xl uppercase leading-none text-vault-text">{selected.name}</h3></div>{selected.isHero && <span className="border border-tungsten/50 px-2 py-1 font-mono text-xs uppercase text-tungsten">Signature build</span>}</div>
              <p className="mt-4 text-sm leading-6 text-vault-text-dim">{selected.lore}</p>
              <div className="mt-5 border-l-2 border-oxide-green bg-oxide-green/5 p-4"><p className="font-mono text-xs uppercase text-oxide-green">Gameplay / {selected.effectName}</p><p className="mt-2 text-vault-text">{selected.protocolLabel}</p><p className="mt-2 font-mono text-xs uppercase text-vault-text-dim">Triggers: {selected.effectTrigger}</p></div>
              <div className="mt-3 border-l-2 border-blueprint bg-blueprint/5 p-4"><p className="font-mono text-xs uppercase text-[#79AEE9]">Appearance only</p><p className="mt-2 text-sm text-vault-text-dim">{selected.finishLabel} changes material treatment. {selected.calibrationLabel} adds the visible {selected.calibrationModule.toLowerCase()}. Neither changes hidden match math.</p></div>
              <div className="mt-3 border-l-2 border-tungsten bg-tungsten/5 p-4"><div className="flex justify-between gap-3"><p className="font-mono text-xs uppercase text-tungsten">Device mastery {selectedMastery.level} / {selectedMastery.title}</p><span className="font-mono text-xs text-vault-text-dim">{selectedMastery.xp} XP</span></div><div className="mt-3 h-1.5 bg-vault-dark"><div className="h-full bg-tungsten" style={{ width: `${selectedMastery.progress}%` }} /></div><p className="mt-3 text-xs text-vault-text-dim">{selectedMastery.activations} signature activations / {selectedMastery.wins} wins / {selectedMastery.runs} recorded runs. Device-local mastery changes the maker mark, never the odds.</p></div>
            </div>
          </div>

          <div className="space-y-5">
            <fieldset className="border border-vault-border bg-vault-dark/35 p-4">
              <legend className="px-2 font-mono text-xs uppercase tracking-[0.14em] text-tungsten">2 / Material finish</legend>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                {MATERIAL_FINISHES.map((finish) => <button key={finish.id} type="button" aria-pressed={finishId === finish.id} onClick={() => setFinish(finish.id)} className={`min-h-[64px] border p-2 text-left ${finishId === finish.id ? 'border-[var(--swatch)] bg-white/5' : 'border-vault-border'}`} style={{ '--swatch': finish.color }}><span className="mb-2 block h-2 w-full" style={{ background: `linear-gradient(90deg, ${finish.shadow}, ${finish.color})` }} /><span className="font-mono text-xs uppercase text-vault-text">{finish.label}</span></button>)}
              </div>
            </fieldset>

            <fieldset className="border border-vault-border bg-vault-dark/35 p-4">
              <legend className="px-2 font-mono text-xs uppercase tracking-[0.14em] text-tungsten">3 / Calibration module</legend>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {CALIBRATIONS.map((calibration) => <button key={calibration.id} type="button" aria-pressed={calibrationId === calibration.id} onClick={() => setCalibration(calibration.id)} className={`min-h-[68px] border p-3 text-left ${calibrationId === calibration.id ? 'border-oxide-green bg-oxide-green/10' : 'border-vault-border'}`}><span className="font-display text-lg uppercase text-vault-text">{calibration.label}</span><span className="mt-1 block text-xs text-vault-text-dim">{calibration.module}</span></button>)}
              </div>
            </fieldset>

            <section className="border border-vault-border bg-vault-dark/35 p-4" aria-labelledby="recipe-heading">
              <div className="flex items-baseline justify-between gap-3"><h3 id="recipe-heading" className="font-display text-2xl uppercase text-vault-text">Assembly recipe</h3><span className="font-mono text-xs uppercase text-vault-text-dim">{selected.rarityNote}</span></div>
              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                {selected.recipe.map(({ materialId, amount }) => {
                  const material = materialById[materialId];
                  const held = inventory.materials[materialId] || 0;
                  const missing = Math.max(0, amount - held);
                  return <article key={materialId} className={`grid grid-cols-[42px_1fr] items-center gap-3 border p-3 ${missing ? 'border-signal-red/45' : 'border-vault-border'}`}><img src={material.image} alt="" className="h-10 w-10 object-contain" /><div><p className="font-mono text-xs uppercase text-vault-text">{amount} {material.label}</p><p className={`mt-1 text-xs ${missing ? 'text-signal-red' : 'text-oxide-green'}`}>{missing ? `Find ${missing} more` : `${held} held / ready`}</p></div></article>;
                })}
              </div>
            </section>

            <p className={`min-h-6 text-sm ${workshop.error && onchainMode ? 'text-signal-red' : 'text-oxide-green'}`} role="status" aria-live="polite">{workshop.error && onchainMode ? (workshop.error.shortMessage || workshop.error.message) : status}</p>

            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              <button type="button" onClick={craft} disabled={transactionPending || selectedOwned || !selectedCraftable} className="min-h-[48px] border border-tungsten/45 px-3 font-mono text-xs uppercase text-tungsten disabled:cursor-not-allowed disabled:border-vault-border disabled:text-vault-text-dim">{workshop.pendingAction?.functionName === 'craftBlueprint' ? 'Confirming...' : selectedOwned ? 'Assembled' : selectedCraftable ? 'Assemble' : 'Need salvage'}</button>
              <button type="button" onClick={equip} disabled={transactionPending || !selectedOwned || inventory.equippedId === selected.id} className="min-h-[48px] bg-tungsten-bright px-3 font-mono text-xs font-semibold uppercase text-vault-dark disabled:cursor-not-allowed disabled:bg-vault-border disabled:text-vault-text-dim">{workshop.pendingAction?.functionName === 'equipBlueprint' ? 'Confirming...' : inventory.equippedId === selected.id ? 'Equipped' : 'Equip'}</button>
              <button type="button" onClick={toggleFavorite} aria-pressed={favoriteIds.includes(selected.id)} className="min-h-[48px] border border-vault-border px-3 font-mono text-xs uppercase text-vault-text">{favoriteIds.includes(selected.id) ? 'Saved favorite' : 'Save favorite'}</button>
              <button type="button" onClick={toggleCompare} aria-pressed={compareIds.includes(selected.id)} className="min-h-[48px] border border-vault-border px-3 font-mono text-xs uppercase text-vault-text">{compareIds.includes(selected.id) ? 'Remove compare' : 'Add to compare'}</button>
            </div>
            {selectedOwned && !STARTER_GADGET_IDS.includes(selected.id) && <button type="button" onClick={reclaim} disabled={transactionPending} className="min-h-[44px] font-mono text-xs uppercase text-signal-red underline decoration-signal-red/50 underline-offset-4">Reclaim build for half salvage</button>}
          </div>
        </div>
      </section>

      {compareGadgets.length > 0 && <section className="mt-6 border border-blueprint/40 bg-blueprint/5 p-5 sm:p-7" aria-labelledby="compare-heading">
        <div className="flex items-end justify-between gap-4"><div><p className="label text-blueprint">Comparison bench</p><h2 id="compare-heading" className="mt-2 font-display text-3xl uppercase text-vault-text">Compare what actually changes</h2></div><button type="button" onClick={() => setCompareIds([])} className="min-h-[44px] font-mono text-xs uppercase text-vault-text-dim">Clear</button></div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {compareGadgets.map((gadget) => <article key={gadget.id} className="grid grid-cols-[120px_1fr] gap-4 border border-vault-border bg-vault-dark/55 p-3"><GadgetVisual gadget={gadget} compact /><div><p className="font-mono text-xs uppercase text-oxide-green">{gadget.serial} / {gadget.protocolFamilyLabel}</p><h3 className="mt-2 font-display text-2xl uppercase text-vault-text">{gadget.name}</h3><p className="mt-2 text-sm text-vault-text">{gadget.effectName}: {gadget.protocolLabel}</p><p className="mt-2 text-xs text-vault-text-dim">{gadget.finishLabel} material / {gadget.calibrationModule}</p><button type="button" onClick={() => selectGadget(gadget)} className="mt-3 min-h-[44px] font-mono text-xs uppercase text-tungsten">Edit this build</button></div></article>)}
        </div>
      </section>}

      <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="border border-vault-border bg-vault-surface p-5 sm:p-7">
          <p className="label text-tungsten">Thirty authored builds</p><h2 className="mt-2 font-display text-3xl uppercase text-vault-text">Stories worth finding</h2>
          <p className="mt-2 text-sm leading-6 text-vault-text-dim">Each chassis has three deliberately named signature configurations. The other builds use honest material, chassis, and calibration names.</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            {HERO_BUILDS.filter((gadget) => gadget.chassisId === chassisId).map((gadget) => <button key={gadget.id} type="button" onClick={() => selectGadget(gadget)} className="min-h-[88px] border border-tungsten/30 bg-vault-dark/40 p-3 text-left"><span className="font-display text-lg uppercase text-vault-text">{gadget.name}</span><span className="mt-1 block text-xs leading-5 text-vault-text-dim">{gadget.configurationName}</span></button>)}
          </div>
        </div>

        <div className="border border-vault-border bg-vault-surface p-5 sm:p-7">
          <p className="label text-tungsten">Collection index</p><h2 className="mt-2 font-display text-3xl uppercase text-vault-text">Find a known blueprint</h2>
          <label className="mt-4 grid gap-2"><span className="font-mono text-xs uppercase text-vault-text-dim">Serial, name, finish, or calibration</span><input type="search" value={lookup} onChange={(event) => setLookup(event.target.value)} placeholder="Try PX-0361 or Masterwork" className="min-h-[48px] border border-vault-border bg-vault-dark px-3 text-vault-text placeholder:text-vault-text-dim/70" /></label>
          {lookup && <div className="mt-3 grid gap-1">{lookupMatches.length ? lookupMatches.map((gadget) => <button key={gadget.id} type="button" onClick={() => selectGadget(gadget)} className="flex min-h-[44px] items-center justify-between gap-3 border border-vault-border px-3 text-left"><span className="truncate text-sm text-vault-text">{gadget.name}</span><span className="shrink-0 font-mono text-xs text-vault-text-dim">{gadget.serial}</span></button>) : <p className="text-sm text-vault-text-dim">No matching configuration.</p>}</div>}
          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-5">{GADGET_CHASSIS.map((chassis) => <div key={chassis.id} className="border border-vault-border p-2"><p className="truncate font-mono text-xs uppercase text-vault-text">{chassis.label}</p><div className="mt-2 h-1 bg-vault-dark"><div className="h-full bg-oxide-green" style={{ width: `${(familyProgress[chassis.id] / 120) * 100}%` }} /></div><p className="mt-2 font-mono text-xs text-vault-text-dim">{familyProgress[chassis.id]} / 120</p></div>)}</div>
        </div>
      </section>

      <details className="mt-6 border border-vault-border bg-vault-surface p-5 sm:p-7">
        <summary className="cursor-pointer font-display text-2xl uppercase text-vault-text">How the system stays honest</summary>
        <div className="mt-5 grid gap-4 text-sm leading-6 text-vault-text-dim md:grid-cols-3">
          <p><strong className="block font-mono text-xs uppercase text-tungsten">Chassis = gameplay</strong>Ten chassis provide ten explicit signatures inside three learnable action families: Pick, Search, and Guard.</p>
          <p><strong className="block font-mono text-xs uppercase text-tungsten">Configuration = expression</strong>Finish, calibration module, rarity, story, and serial create collectible identity without hidden power.</p>
          <p><strong className="block font-mono text-xs uppercase text-tungsten">Salvage = choices</strong>Every completed match pays materials. Unwanted custom builds can be reclaimed for half their recipe.</p>
        </div>
      </details>
    </div>
  );
}
