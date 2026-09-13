import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const appDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const manifestPath = resolve(appDir, 'world', 'manifest.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const command = process.argv[2] || 'validate';
const sourceRoot = resolve(appDir, 'assets', 'world-source');
const renderRoot = resolve(sourceRoot, 'renders');
const reportRoot = resolve(appDir, 'reports', 'world', 'latest');
const publicBackdrop = resolve(appDir, manifest.source.shippingBackdrop);

function executableCandidates() {
  if (process.env.BLENDER_BIN) return [process.env.BLENDER_BIN];
  if (process.platform === 'win32') {
    return [
      'C:\\Program Files\\Blender Foundation\\Blender 4.5\\blender.exe',
      'C:\\Program Files\\Blender Foundation\\Blender 4.4\\blender.exe',
      'C:\\Program Files\\Blender Foundation\\Blender 3.4\\blender.exe',
    ];
  }
  return ['blender'];
}

function run(program, args, options = {}) {
  const result = spawnSync(program, args, {
    cwd: appDir,
    env: process.env,
    encoding: 'utf8',
    stdio: options.stdio || 'inherit',
    windowsHide: true,
    shell: false,
    timeout: options.timeout || 900_000,
  });
  if (result.error || result.status !== 0) {
    const detail = result.error?.message || result.stderr || `${program} exited ${result.status}`;
    throw new Error(detail);
  }
  return result;
}

function python(scriptArgs) {
  const candidates = process.platform === 'win32'
    ? [['py', ['-3', ...scriptArgs]], ['python', scriptArgs]]
    : [['python3', scriptArgs], ['python', scriptArgs]];
  let lastError;
  for (const [program, args] of candidates) {
    const result = spawnSync(program, args, { cwd: appDir, encoding: 'utf8', stdio: 'inherit', windowsHide: true, shell: false });
    if (!result.error && result.status === 0) return;
    lastError = result.error || new Error(`${program} exited ${result.status}`);
    if (result.error?.code !== 'ENOENT') break;
  }
  throw lastError || new Error('Python with Pillow is required.');
}

function findBlender() {
  const candidate = executableCandidates().find((path) => path === 'blender' || existsSync(path));
  if (!candidate) throw new Error('Blender was not found. Set BLENDER_BIN to blender.exe.');
  return candidate;
}

function build() {
  mkdirSync(sourceRoot, { recursive: true });
  mkdirSync(reportRoot, { recursive: true });
  const blender = findBlender();
  const [width, height] = manifest.camera.renderSize;
  run(blender, [
    '--background',
    '--factory-startup',
    '--python-exit-code', '1',
    '--python', resolve(appDir, manifest.source.builder),
    '--',
    '--output-dir', sourceRoot,
    '--blend-path', resolve(appDir, manifest.source.blend),
    '--width', String(width),
    '--height', String(height),
  ]);
  python([
    resolve(appDir, 'scripts', 'build-world-derivatives.py'),
    '--source', renderRoot,
    '--shipping', publicBackdrop,
    '--report', reportRoot,
    '--max-bytes', String(manifest.budgets.maxShippingBackdropBytes),
  ]);
  const cameraEvidence = JSON.parse(readFileSync(resolve(sourceRoot, 'camera-segments.json'), 'utf8'));
  const perspectiveArgs = [
    resolve(appDir, 'scripts', 'perspective-evidence.py'),
    '--image', resolve(renderRoot, 'preparing.png'),
    '--output-dir', resolve(reportRoot, 'perspective'),
  ];
  for (const segment of cameraEvidence.parallelWorldLines) perspectiveArgs.push('--segment', segment.join(','));
  python(perspectiveArgs);
}

function pngDimensions(path) {
  const buffer = readFileSync(path);
  const signature = buffer.subarray(1, 4).toString('ascii');
  if (signature !== 'PNG') throw new Error(`${path} is not a PNG.`);
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

function validate() {
  const errors = [];
  if (manifest.schemaVersion !== 1) errors.push('schemaVersion must be 1.');
  if (manifest.deliveryMode !== 'layered-2.5d') errors.push('deliveryMode must remain layered-2.5d until a real-time migration is approved.');
  if (manifest.truths.operatorCount !== 4) errors.push('The canonical world requires four operator positions.');
  if (manifest.truths.rivalStationCount !== 3) errors.push('The canonical world requires three rival stations.');
  if (manifest.truths.lockCount !== 5) errors.push('The canonical vault requires five locks.');
  if (manifest.planes.map(({ id }) => id).join(',') !== 'architecture,rivals,mechanism,workbench,interface') errors.push('Depth-plane order drifted.');
  if (manifest.materials.length > manifest.budgets.maxMaterials) errors.push('Material budget exceeded.');
  if (manifest.states.length !== 5) errors.push('Exactly five canonical world states are required.');
  if (manifest.camera.lensMm < 35 || manifest.camera.lensMm > 50) errors.push('Camera lens must stay in the approved 35-50mm range.');
  const [width, height] = manifest.camera.renderSize;
  for (const state of manifest.states) {
    const render = resolve(renderRoot, `${state.id}.png`);
    if (!existsSync(render)) {
      errors.push(`Missing canonical render: ${state.id}.png`);
      continue;
    }
    const dimensions = pngDimensions(render);
    if (dimensions.width !== width || dimensions.height !== height) errors.push(`${state.id} render dimensions drifted.`);
    for (const passName of ['depth', 'normal', 'object-id']) {
      const passDir = resolve(sourceRoot, 'passes', state.id);
      const passExists = existsSync(passDir) && readdirSync(passDir).some((name) => name.startsWith(`${passName}-`) && name.endsWith('.png'));
      if (!passExists) errors.push(`Missing ${passName} pass for ${state.id}.`);
    }
  }
  if (!existsSync(resolve(appDir, manifest.source.blend))) errors.push('Missing canonical Blender scene.');
  const statsPath = resolve(sourceRoot, 'scene-stats.json');
  if (!existsSync(statsPath)) errors.push('Missing canonical Blender scene statistics.');
  else {
    const stats = JSON.parse(readFileSync(statsPath, 'utf8'));
    if (stats.triangles > manifest.budgets.maxSourceTriangles) errors.push('Source triangle budget exceeded.');
    if (stats.materials > manifest.budgets.maxMaterials) errors.push('Blender material budget exceeded.');
    if (stats.dynamicLights > manifest.budgets.maxDynamicLights) errors.push('Dynamic light budget exceeded.');
  }
  if (!existsSync(publicBackdrop)) errors.push('Missing shipping world backdrop.');
  else if (statSync(publicBackdrop).size > manifest.budgets.maxShippingBackdropBytes) errors.push('Shipping backdrop exceeds its byte budget.');
  const perspectivePath = resolve(reportRoot, 'perspective', 'instant-scene-perspective.json');
  if (!existsSync(perspectivePath)) errors.push('Missing fitted perspective evidence.');
  else {
    const perspective = JSON.parse(readFileSync(perspectivePath, 'utf8'));
    const [actualX, actualY] = perspective.vanishingPointNormalized;
    const [expectedX, expectedY] = manifest.camera.vanishingPointNormalized;
    if (Math.abs(actualX - expectedX) > 0.02 || Math.abs(actualY - expectedY) > 0.02) errors.push('Rendered camera no longer matches the manifest vanishing point.');
    if (perspective.fitResidualRmsPixels > 2) errors.push('Perspective evidence has an excessive line-fit residual.');
  }
  if (errors.length) throw new Error(`World validation failed:\n- ${errors.join('\n- ')}`);

  mkdirSync(reportRoot, { recursive: true });
  const record = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    worldVersion: manifest.version,
    status: 'pass',
    deliveryMode: manifest.deliveryMode,
    states: manifest.states.map(({ id }) => id),
    renderSize: manifest.camera.renderSize,
    shippingBackdropBytes: statSync(publicBackdrop).size,
    sourceStats: JSON.parse(readFileSync(statsPath, 'utf8')),
    checks: ['world truths', 'camera contract', 'fitted perspective', 'plane order', 'source budgets', 'state renders', 'depth/normal/object-id passes', 'shipping byte budget'],
  };
  writeFileSync(resolve(reportRoot, 'validation.json'), `${JSON.stringify(record, null, 2)}\n`, 'utf8');
  writeFileSync(resolve(reportRoot, 'validation.md'), [
    '# Nightfall Vault validation',
    '',
    `Status: **PASS**`,
    `World version: ${manifest.version}`,
    `Delivery: ${manifest.deliveryMode}`,
    `Canonical states: ${record.states.join(', ')}`,
    `Render size: ${width}x${height}`,
    `Source: ${record.sourceStats.triangles} triangles / ${record.sourceStats.materials} materials / ${record.sourceStats.dynamicLights} dynamic lights`,
    `Shipping backdrop: ${record.shippingBackdropBytes} bytes / ${manifest.budgets.maxShippingBackdropBytes} byte budget`,
    '',
    'Validated: world truths, camera contract, fitted perspective, depth-plane order, source budgets, state renders, render passes, and shipping byte budget.',
    '',
  ].join('\n'), 'utf8');
  console.log(`World validation passed: ${manifest.states.length} states / ${manifest.planes.length} depth planes.`);
}

if (command === 'build') build();
else if (command === 'validate') validate();
else if (command === 'all') { build(); validate(); }
else throw new Error(`Unknown world-pipeline command: ${command}`);
