import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from '@playwright/test';
import {
  CALIBRATIONS,
  CRAFTING_MATERIALS,
  GADGET_BLUEPRINT_COUNT,
  GADGET_CATALOG,
  GADGET_CHASSIS,
  HERO_BUILDS,
  MATERIAL_FINISHES,
} from '../src/data/gadgetInventory.js';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const appDir = resolve(scriptDir, '..');
const outputDir = resolve(appDir, 'reports', 'workshop-contact-sheet');
const htmlPath = resolve(outputDir, 'contact-sheet.html');
const imagePath = resolve(outputDir, 'plundrix-workshop-contact-sheet.png');

const rarityTone = { field: '#8e938f', tuned: '#79aee9', rare: '#58c69b', masterwork: '#e8b078' };
const materialTone = { 'brass-cogs': '#c4956a', 'cipher-glass': '#79aee9', 'flux-wire': '#d57b57', 'tungsten-shard': '#a7acbd', 'oxide-catalyst': '#58c69b', 'vault-resin': '#e8b078' };
const materialShort = Object.fromEntries(CRAFTING_MATERIALS.map((material) => [material.id, material.label.split(' ').map((part) => part[0]).join('')]));

function escapeHtml(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}

function assetPath(path) {
  return `../../public${path}`;
}

function recipeLabel(gadget) {
  return gadget.recipe.map(({ materialId, amount }) => `${materialShort[materialId]}${amount}`).join(' ');
}

function configurationCell(gadget) {
  const search = [gadget.serial, gadget.name, gadget.chassisLabel, gadget.finishLabel, gadget.calibrationLabel, gadget.rarityLabel, gadget.protocolFamilyLabel].join(' ').toLowerCase();
  return `<article class="configuration ${gadget.isHero ? 'hero-build' : ''}" data-blueprint data-chassis="${gadget.chassisId}" data-finish="${gadget.finishId}" data-calibration="${gadget.calibrationId}" data-rarity="${gadget.rarity}" data-search="${escapeHtml(search)}" style="--finish:${gadget.finishColor};--rarity:${rarityTone[gadget.rarity]}" title="${escapeHtml(`${gadget.name} - ${gadget.lore}`)}">
    <div class="cell-top"><span>${gadget.serial}</span><b>${gadget.rarityLabel.slice(0, 1)}</b></div>
    <span class="module-mark">${escapeHtml(gadget.calibrationLabel.slice(0, 2).toUpperCase())}</span>
    <strong>${escapeHtml(gadget.calibrationLabel)}</strong>
    <small>${escapeHtml(recipeLabel(gadget))}</small>
  </article>`;
}

const rarityCounts = Object.fromEntries(['field', 'tuned', 'rare', 'masterwork'].map((rarity) => [rarity, GADGET_CATALOG.filter((gadget) => gadget.rarity === rarity).length]));

const chassisSections = GADGET_CHASSIS.map((chassis, index) => {
  const gadgets = GADGET_CATALOG.filter((gadget) => gadget.chassisId === chassis.id);
  const rows = MATERIAL_FINISHES.map((finish) => {
    const row = gadgets.filter((gadget) => gadget.finishId === finish.id);
    return `<div class="finish-row" data-finish-row="${finish.id}">
      <div class="finish-key" style="--finish:${finish.color}"><b>${escapeHtml(finish.label)}</b><span>${escapeHtml(finish.note)}</span></div>
      ${row.map(configurationCell).join('')}
    </div>`;
  }).join('');
  const heroes = HERO_BUILDS.filter((gadget) => gadget.chassisId === chassis.id);
  return `<section class="chassis-section" data-section="${chassis.id}">
    <header class="chassis-header">
      <div class="chassis-number">${String(index + 1).padStart(2, '0')}</div>
      <div class="artifact"><img src="${assetPath(chassis.image)}" alt=""><i></i></div>
      <div class="chassis-copy"><p>${escapeHtml(chassis.protocol === 'precision-kit' ? 'PICK' : chassis.protocol === 'signal-scanner' ? 'SEARCH' : 'GUARD')} FAMILY / ${escapeHtml(chassis.role)}</p><h2>${escapeHtml(chassis.label)}</h2><span>${escapeHtml(chassis.description)}</span></div>
      <div class="chassis-effect"><b>${escapeHtml(chassis.effectName)}</b><span>${escapeHtml(chassis.effect)}</span><em>TRIGGER / ${escapeHtml(chassis.trigger)}</em></div>
    </header>
    <div class="hero-strip"><b>AUTHORED BUILDS</b>${heroes.map((gadget) => `<span><strong>${escapeHtml(gadget.name)}</strong>${escapeHtml(gadget.configurationName)}</span>`).join('')}</div>
    <div class="axis-labels"><span>FINISH / 12 MODULES</span>${CALIBRATIONS.map((calibration) => `<span>${escapeHtml(calibration.label)}</span>`).join('')}</div>
    <div class="matrix">${rows}</div>
  </section>`;
}).join('');

const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Plundrix Workshop - Ten Gadgets, 1,200 Configurations</title>
  <style>
    :root{color-scheme:dark;--ink:#e8e4dc;--dim:#989b98;--paper:#080b0a;--panel:#111614;--line:#29302d;--brass:#c4956a;--oxide:#58c69b}*{box-sizing:border-box}html{background:#050706}body{margin:0;background:#050706;color:var(--ink);font-family:"Arial Narrow","Roboto Condensed",Arial,sans-serif}button,input,select{font:inherit}.sheet{width:2200px;margin:0 auto;padding:46px;background:radial-gradient(circle at 88% 2%,rgba(196,149,106,.13),transparent 14%),linear-gradient(180deg,#101513,#080b0a 42%,#050706)}
    .masthead{border:1px solid var(--line);background:rgba(17,22,20,.94);padding:42px;position:relative;overflow:hidden}.masthead:before{content:"";position:absolute;inset:0 auto 0 0;width:6px;background:linear-gradient(var(--brass),var(--oxide))}.eyebrow{margin:0;color:var(--oxide);font:700 13px/1.2 Consolas,monospace;letter-spacing:.22em;text-transform:uppercase}h1{margin:15px 0 12px;max-width:1700px;font-size:68px;line-height:.88;letter-spacing:.015em;text-transform:uppercase}.deck{max-width:1550px;margin:0;color:#b6bab6;font-size:22px;line-height:1.5}.summary{display:grid;grid-template-columns:repeat(6,1fr);gap:8px;margin-top:28px}.summary div{border:1px solid var(--line);background:#090c0b;padding:13px 15px}.summary b{display:block;color:var(--brass);font:700 24px/1 Consolas,monospace}.summary span{display:block;margin-top:6px;color:var(--dim);font:11px/1.2 Consolas,monospace;letter-spacing:.12em;text-transform:uppercase}.controls{display:flex;align-items:center;gap:10px;margin-top:22px}.controls input,.controls select,.controls button{min-height:42px;border:1px solid #3c4541;background:#080b0a;color:var(--ink);padding:8px 13px}.controls input{width:390px}.controls button{color:var(--brass);cursor:pointer}#visible-count{margin-left:auto;color:var(--oxide);font:12px Consolas,monospace;letter-spacing:.1em;text-transform:uppercase}
    .legend{margin-top:18px;border:1px solid var(--line);background:#0d110f;padding:22px}.legend h2{margin:0 0 5px;font-size:24px;text-transform:uppercase}.legend>p{margin:0 0 14px;color:var(--dim)}.materials{display:grid;grid-template-columns:repeat(6,1fr);gap:8px}.material{display:grid;grid-template-columns:58px 1fr;gap:10px;align-items:center;min-height:72px;border:1px solid var(--line);padding:8px;background:#080b0a}.material img{width:56px;height:56px;object-fit:contain}.material b{display:block;font-size:14px;text-transform:uppercase}.material span{display:block;margin-top:4px;color:var(--dim);font:10px Consolas,monospace}
    .chassis-section{margin-top:28px;border:1px solid #303835;background:#0b0f0d;padding:18px;break-inside:avoid}.chassis-section.filtered-out{display:none}.chassis-header{display:grid;grid-template-columns:76px 150px 1fr 430px;gap:18px;align-items:center;min-height:160px;border-bottom:1px solid var(--line);padding:0 4px 15px}.chassis-number{color:#3c4541;font:700 52px/1 Consolas,monospace}.artifact{position:relative;display:grid;width:140px;height:140px;place-items:center;border:1px solid #303835;background:radial-gradient(circle,rgba(196,149,106,.14),transparent 65%),#080b0a}.artifact img{width:125px;height:125px;object-fit:contain;filter:saturate(.72) drop-shadow(0 12px 12px #000)}.artifact i{position:absolute;right:8px;bottom:8px;width:12px;height:12px;border:1px solid var(--oxide);border-radius:50%}.chassis-copy p{margin:0;color:var(--oxide);font:10px Consolas,monospace;letter-spacing:.15em}.chassis-copy h2{margin:7px 0 4px;font-size:38px;line-height:1;text-transform:uppercase}.chassis-copy span{color:var(--dim);font-size:15px}.chassis-effect{border-left:2px solid var(--brass);padding-left:16px}.chassis-effect b{display:block;color:var(--brass);font:700 18px Consolas,monospace;text-transform:uppercase}.chassis-effect span{display:block;margin-top:7px;font-size:14px;line-height:1.45}.chassis-effect em{display:block;margin-top:8px;color:var(--dim);font:normal 9px Consolas,monospace;letter-spacing:.1em}.hero-strip{display:grid;grid-template-columns:150px repeat(3,1fr);gap:6px;align-items:stretch;padding:10px 0}.hero-strip>b,.hero-strip span{border:1px solid var(--line);padding:8px}.hero-strip>b{display:grid;place-items:center;color:var(--brass);font:10px Consolas,monospace}.hero-strip span{display:flex;justify-content:space-between;color:var(--dim);font:9px Consolas,monospace;text-transform:uppercase}.hero-strip strong{color:var(--ink)}.axis-labels,.finish-row{display:grid;grid-template-columns:150px repeat(12,minmax(0,1fr));gap:5px}.axis-labels{padding:7px 0}.axis-labels span{overflow:hidden;color:#727773;font:8px Consolas,monospace;text-align:center;text-overflow:ellipsis;text-transform:uppercase;white-space:nowrap}.axis-labels span:first-child{color:var(--brass);text-align:left}.finish-row{margin-bottom:5px}.finish-key{min-height:86px;border:1px solid var(--line);border-left:5px solid var(--finish);background:#080b0a;padding:9px}.finish-key b{display:block;font-size:13px;text-transform:uppercase}.finish-key span{display:block;margin-top:7px;color:var(--dim);font:8px/1.35 Consolas,monospace}.configuration{position:relative;min-width:0;min-height:86px;border:1px solid #28302d;border-top:4px solid var(--finish);background:linear-gradient(155deg,color-mix(in srgb,var(--finish) 9%,transparent),transparent 52%),#111614;padding:7px;overflow:hidden}.configuration[hidden]{display:none}.configuration.hero-build{box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--finish) 48%,white)}.cell-top{display:flex;justify-content:space-between;gap:4px;color:#777d78;font:7px Consolas,monospace}.cell-top b{color:var(--rarity)}.module-mark{display:grid;width:24px;height:24px;margin:5px 0 3px;place-items:center;border:1px solid color-mix(in srgb,var(--finish) 60%,white);border-radius:50%;color:var(--finish);font:700 8px Consolas,monospace}.configuration strong{display:block;overflow:hidden;color:#d6d7d3;font-size:9px;text-overflow:ellipsis;text-transform:uppercase;white-space:nowrap}.configuration small{display:block;margin-top:3px;color:#777d78;font:7px Consolas,monospace}.footer{margin-top:28px;border:1px solid var(--line);padding:22px;color:#777d78;font:11px/1.6 Consolas,monospace}.footer b{color:var(--brass)}@media print{.controls{display:none}.sheet{margin:0}}
  </style>
</head>
<body><main class="sheet">
  <header class="masthead"><p class="eyebrow">Plundrix / Operator Workshop / Configuration Atlas</p><h1>10 signature gadgets. 1,200 possible builds.</h1><p class="deck">Chassis determines gameplay. Finish and calibration determine visible expression. Every stable serial remains represented below without repeating the same chassis image 120 times.</p>
    <div class="summary"><div><b>10</b><span>Gameplay signatures</span></div><div><b>${GADGET_BLUEPRINT_COUNT.toLocaleString()}</b><span>Configurations</span></div><div><b>10</b><span>Finishes</span></div><div><b>12</b><span>Visible modules</span></div><div><b>30</b><span>Authored builds</span></div><div><b>3</b><span>Action families</span></div></div>
    <div class="controls"><input id="search" type="search" placeholder="Search serial, story name, finish, calibration..." aria-label="Search configurations"><select id="chassis" aria-label="Filter chassis"><option value="all">All chassis</option>${GADGET_CHASSIS.map((chassis) => `<option value="${chassis.id}">${escapeHtml(chassis.label)}</option>`).join('')}</select><select id="finish" aria-label="Filter finish"><option value="all">All finishes</option>${MATERIAL_FINISHES.map((finish) => `<option value="${finish.id}">${escapeHtml(finish.label)}</option>`).join('')}</select><select id="rarity" aria-label="Filter rarity"><option value="all">All rarities</option>${Object.entries(rarityCounts).map(([rarity, count]) => `<option value="${rarity}">${rarity} / ${count}</option>`).join('')}</select><button id="reset" type="button">Reset</button><button type="button" onclick="window.print()">Print / PDF</button><span id="visible-count">${GADGET_BLUEPRINT_COUNT.toLocaleString()} visible</span></div>
  </header>
  <section class="legend"><h2>Crafting materials</h2><p>Recipes express how a build is assembled; rarity changes workmanship and cost, never hidden match power.</p><div class="materials">${CRAFTING_MATERIALS.map((material) => `<article class="material" style="border-top-color:${materialTone[material.id]}"><img src="${assetPath(material.image)}" alt=""><div><b>${escapeHtml(material.label)}</b><span>${escapeHtml(material.description)}</span></div></article>`).join('')}</div></section>
  ${chassisSections}
  <footer class="footer"><b>CATALOG CONTRACT:</b> Stable IDs remain chassis-major, then finish, then calibration. The ten chassis signatures are live gameplay rules. Finish, calibration module, rarity, story, and serial are visible collection identity without hidden power.</footer>
</main><script>
  const search=document.querySelector('#search'),chassis=document.querySelector('#chassis'),finish=document.querySelector('#finish'),rarity=document.querySelector('#rarity'),count=document.querySelector('#visible-count');const cards=Array.from(document.querySelectorAll('[data-blueprint]')),sections=Array.from(document.querySelectorAll('[data-section]'));
  function applyFilters(){const term=search.value.trim().toLowerCase();let visible=0;for(const card of cards){const show=(!term||card.dataset.search.includes(term))&&(chassis.value==='all'||card.dataset.chassis===chassis.value)&&(finish.value==='all'||card.dataset.finish===finish.value)&&(rarity.value==='all'||card.dataset.rarity===rarity.value);card.hidden=!show;if(show)visible+=1}for(const section of sections)section.classList.toggle('filtered-out',!section.querySelector('[data-blueprint]:not([hidden])'));count.textContent=visible.toLocaleString()+' visible'}
  search.addEventListener('input',applyFilters);chassis.addEventListener('change',applyFilters);finish.addEventListener('change',applyFilters);rarity.addEventListener('change',applyFilters);document.querySelector('#reset').addEventListener('click',()=>{search.value='';chassis.value='all';finish.value='all';rarity.value='all';applyFilters();search.focus()});
</script></body></html>`;

await mkdir(outputDir, { recursive: true });
await writeFile(htmlPath, html, 'utf8');

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 2200, height: 1400 }, deviceScaleFactor: 1 });
  await page.goto(pathToFileURL(htmlPath).href, { waitUntil: 'load' });
  const imageState = await page.evaluate(async () => {
    const images = Array.from(document.images);
    await Promise.all(images.map((image) => image.decode().catch(() => undefined)));
    return { total: images.length, failed: images.filter((image) => !image.naturalWidth).map((image) => image.src) };
  });
  if (imageState.failed.length) throw new Error(`Contact sheet has ${imageState.failed.length} failed images: ${imageState.failed.slice(0, 3).join(', ')}`);
  const structure = await page.evaluate(() => ({ cards: document.querySelectorAll('[data-blueprint]').length, sections: Array.from(document.querySelectorAll('[data-section]')).map((section) => section.querySelectorAll('[data-blueprint]').length) }));
  if (structure.cards !== GADGET_BLUEPRINT_COUNT || structure.sections.length !== GADGET_CHASSIS.length || structure.sections.some((count) => count !== 120)) throw new Error(`Unexpected contact-sheet structure: ${JSON.stringify(structure)}`);
  await page.locator('#search').fill('PX-1200');
  if (await page.locator('[data-blueprint]:not([hidden])').count() !== 1) throw new Error('Serial search filter failed');
  await page.locator('#reset').click();
  await page.locator('#chassis').selectOption('firewall');
  if (await page.locator('[data-blueprint]:not([hidden])').count() !== 120) throw new Error('Chassis filter failed');
  await page.locator('#reset').click();
  await page.locator('#finish').selectOption('signal-red');
  if (await page.locator('[data-blueprint]:not([hidden])').count() !== 120) throw new Error('Finish filter failed');
  await page.locator('#reset').click();
  await page.locator('#rarity').selectOption('masterwork');
  if (await page.locator('[data-blueprint]:not([hidden])').count() !== rarityCounts.masterwork) throw new Error('Rarity filter failed');
  await page.locator('#reset').click();
  const dimensions = await page.evaluate(() => ({ width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight }));
  await page.screenshot({ path: imagePath, fullPage: true, animations: 'disabled' });
  console.log(`Workshop atlas: ${GADGET_BLUEPRINT_COUNT} configurations, ${imageState.total} shared image instances, ${dimensions.width}x${dimensions.height}px.`);
  console.log('Verified: 10 x 120 structure, serial search, chassis/finish/rarity filters, reset, and all image loads.');
  console.log(`HTML: ${htmlPath}`);
  console.log(`PNG:  ${imagePath}`);
} finally {
  await browser.close();
}
