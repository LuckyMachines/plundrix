import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, renameSync, statSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { basename, dirname, relative, resolve, sep } from 'node:path';
import { spawnSync } from 'node:child_process';

const VALID_STATUSES = new Set(['accepted', 'needs-revision', 'briefed', 'retired']);
const VALID_FORMATS = new Set(['webp', 'jpeg', 'png']);

export function selectAssets(assets, { assetId, familyId, includeRetired = false } = {}) {
  return assets.filter((asset) => (
    (!assetId || asset.id === assetId)
    && (!familyId || asset.family === familyId)
    && (includeRetired || asset.status !== 'retired')
  ));
}

export function validateDefinitions({ assets, direction, familiesById, partsById }) {
  const errors = [];
  const ids = new Set();
  const outputPaths = new Set();

  if (!direction?.promise || !direction?.style || !direction?.globalConstraints?.length) {
    errors.push('Art direction must define a promise, style, and global constraints.');
  }

  for (const asset of assets) {
    const prefix = asset?.id ? `${asset.id}: ` : 'unknown asset: ';
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(asset?.id || '')) errors.push(`${prefix}id must be kebab-case.`);
    if (ids.has(asset.id)) errors.push(`${prefix}duplicate asset id.`);
    ids.add(asset.id);
    if (!familiesById[asset.family]) errors.push(`${prefix}unknown family "${asset.family}".`);
    if (!VALID_STATUSES.has(asset.status)) errors.push(`${prefix}status must be accepted, needs-revision, briefed, or retired.`);
    if (!asset.brief || !asset.subject || !asset.composition) errors.push(`${prefix}brief, subject, and composition are required.`);
    if (!asset.joy?.target || !asset.joy?.mechanism || !asset.joy?.restraint) errors.push(`${prefix}joy target, mechanism, and restraint are required.`);
    if (asset.status === 'needs-revision' && !asset.reviewNote) errors.push(`${prefix}needs-revision assets require a concrete review note.`);
    if (['accepted', 'needs-revision'].includes(asset.status) && !asset.generation?.model) errors.push(`${prefix}shipping assets require generation provenance.`);
    if (['accepted', 'needs-revision'].includes(asset.status) && typeof asset.alt !== 'string') errors.push(`${prefix}shipping assets require an explicit alt treatment.`);
    if (!asset.canvas?.width || !asset.canvas?.height) errors.push(`${prefix}canvas dimensions are required.`);
    if (!asset.source?.startsWith('assets/')) errors.push(`${prefix}source masters must live under assets/.`);
    if (!Array.isArray(asset.parts) || asset.parts.length === 0) errors.push(`${prefix}at least one reusable art part is required.`);
    for (const partId of asset.parts || []) {
      if (!partsById[partId]) errors.push(`${prefix}unknown part "${partId}".`);
    }
    if (!Array.isArray(asset.outputs) || asset.outputs.length === 0) errors.push(`${prefix}at least one delivery output is required.`);
    if (!Array.isArray(asset.manualChecks) || asset.manualChecks.length < 3) errors.push(`${prefix}at least three manual checks are required.`);
    if (asset.composite) {
      if (!asset.composite.basePrompt || !asset.composite.part?.startsWith('assets/') || !asset.composite.size) errors.push(`${prefix}composite assets require a base prompt, part source, and size.`);
      if (!Array.isArray(asset.composite.positions) || asset.composite.positions.length === 0) errors.push(`${prefix}composite assets require at least one part position.`);
      if (asset.composite.expectedCount !== asset.composite.positions?.length) errors.push(`${prefix}composite expected count must match its declared positions.`);
    }

    for (const output of asset.outputs || []) {
      if (!output.path?.startsWith('public/images/')) errors.push(`${prefix}delivery outputs must live under public/images/.`);
      if (!output.publicPath?.startsWith('/images/')) errors.push(`${prefix}publicPath must begin with /images/.`);
      if (!VALID_FORMATS.has(output.format)) errors.push(`${prefix}unsupported output format "${output.format}".`);
      if (!output.width || !output.height || !output.minBytes || !output.maxBytes) errors.push(`${prefix}each output needs dimensions and a byte budget.`);
      if (output.minBytes >= output.maxBytes) errors.push(`${prefix}${output.path} has an invalid byte budget.`);
      if (outputPaths.has(output.path)) errors.push(`${prefix}duplicate output path "${output.path}".`);
      outputPaths.add(output.path);
      if (output.treatment === 'social-card-v1') {
        const copy = output.copy;
        if (!copy?.eyebrow || copy?.headline?.length !== 2 || !copy?.footer) errors.push(`${prefix}social-card-v1 requires eyebrow, two headline lines, and footer copy.`);
      }
      if (asset.family === 'transparent-part' && output.alpha !== true) errors.push(`${prefix}transparent parts must explicitly require alpha.`);
    }
  }

  return errors;
}

export function composePrompt(asset, { direction, familiesById, partsById }) {
  const family = familiesById[asset.family];
  if (!family) throw new Error(`Unknown art family: ${asset.family}`);
  const partPrompts = asset.parts.map((id) => partsById[id]?.prompt).filter(Boolean);
  const partTruths = asset.parts.map((id) => partsById[id]?.truth).filter(Boolean);
  const references = direction.referenceAnchors
    .filter((reference) => reference.path !== asset.source)
    .map((reference, index) => `Image ${index + 1}: ${reference.path} - ${reference.role}`);
  const constraints = unique([
    ...direction.globalConstraints,
    ...family.constraints,
    ...asset.constraints,
    ...partTruths,
  ]);

  return [
    `Use case: ${family.useCase}`,
    `Asset type: ${family.assetType}`,
    `Primary request: ${asset.brief}`,
    `Input images: ${references.join('; ')}`,
    `Scene/backdrop: ${asset.scene}`,
    `Subject: ${asset.subject} Reusable parts: ${partPrompts.join('; ')}.`,
    `Style/medium: ${direction.style}`,
    `Composition/framing: ${asset.composition} ${family.composition}`,
    `Lighting/mood: ${asset.lighting} ${family.mood}`,
    `Color palette: ${direction.palette.join('; ')}`,
    `Materials/textures: ${direction.materials.join('; ')}`,
    `Joy target: ${asset.joy.target}. ${asset.joy.mechanism}`,
    `Restraint: ${asset.joy.restraint}`,
    `Constraints: ${constraints.join('; ')}`,
    `Avoid: ${unique(asset.avoid || []).join('; ')}`,
    `Output intent: ${asset.canvas.width}x${asset.canvas.height} source master saved as ${asset.source}`,
  ].join('\n');
}

export function probeImage(path) {
  const data = readFileSync(path);
  if (data.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
    const colorType = data[25];
    return { width: data.readUInt32BE(16), height: data.readUInt32BE(20), pixelFormat: [4, 6].includes(colorType) ? 'rgba' : 'rgb' };
  }
  if (data.subarray(0, 2).equals(Buffer.from([0xff, 0xd8]))) return probeJpeg(data, path);
  if (data.toString('ascii', 0, 4) === 'RIFF' && data.toString('ascii', 8, 12) === 'WEBP') return probeWebp(data, path);
  throw new Error(`Unsupported image format for ${path}.`);
}

export function inspectAssetFiles({ appDir, assets }) {
  const errors = [];
  const inventory = [];

  for (const asset of assets) {
    const sourcePath = resolveWithin(appDir, asset.source);
    const sourceExists = existsSync(sourcePath);
    const row = { id: asset.id, status: asset.status, source: null, outputs: [] };

    if (['accepted', 'needs-revision'].includes(asset.status) && !sourceExists) errors.push(`${asset.id}: shipping source is missing at ${asset.source}.`);
    if (sourceExists) {
      try {
        const dimensions = probeImage(sourcePath);
        if (dimensions.width !== asset.canvas.width || dimensions.height !== asset.canvas.height) {
          errors.push(`${asset.id}: source is ${dimensions.width}x${dimensions.height}; manifest declares ${asset.canvas.width}x${asset.canvas.height}.`);
        }
        if (asset.outputs.some((output) => output.alpha) && dimensions.pixelFormat !== 'rgba') {
          errors.push(`${asset.id}: transparent source ${asset.source} does not contain an alpha channel.`);
        }
        row.source = fileRecord(sourcePath, appDir, dimensions);
      } catch (error) {
        errors.push(`${asset.id}: ${error.message}`);
      }
    }

    for (const output of asset.outputs) {
      const outputPath = resolveWithin(appDir, output.path);
      if (['accepted', 'needs-revision'].includes(asset.status) && !existsSync(outputPath)) errors.push(`${asset.id}: shipping output is missing at ${output.path}.`);
      if (!existsSync(outputPath)) continue;
      try {
        const dimensions = probeImage(outputPath);
        const size = statSync(outputPath).size;
        if (dimensions.width !== output.width || dimensions.height !== output.height) {
          errors.push(`${asset.id}: ${output.path} is ${dimensions.width}x${dimensions.height}; expected ${output.width}x${output.height}.`);
        }
        if (output.alpha && dimensions.pixelFormat !== 'rgba') {
          errors.push(`${asset.id}: ${output.path} does not contain the required alpha channel.`);
        }
        if (size < output.minBytes || size > output.maxBytes) {
          errors.push(`${asset.id}: ${output.path} is ${size} bytes; budget is ${output.minBytes}-${output.maxBytes}.`);
        }
        row.outputs.push(fileRecord(outputPath, appDir, dimensions));
      } catch (error) {
        errors.push(`${asset.id}: ${error.message}`);
      }
    }
    inventory.push(row);
  }

  return { errors, inventory };
}

export function buildAssets({ appDir, assets, dryRun = false }) {
  const built = [];
  const skipped = [];
  for (const asset of assets) {
    const sourcePath = resolveWithin(appDir, asset.source);
    if (!existsSync(sourcePath)) {
      skipped.push(`${asset.id} (source not generated yet)`);
      continue;
    }
    for (const output of asset.outputs) {
      const outputPath = resolveWithin(appDir, output.path);
      mkdirSync(dirname(outputPath), { recursive: true });
      const args = buildFfmpegArgs({ asset, output, sourcePath, outputPath, appDir });
      if (!dryRun) {
        const result = spawnSync('ffmpeg', args, { cwd: appDir, encoding: 'utf8', windowsHide: true });
        if (result.status !== 0) throw new Error(`ffmpeg failed for ${asset.id}: ${result.stderr || 'unknown error'}`);
      }
      built.push(`${asset.id} -> ${output.path}${dryRun ? ' (dry run)' : ''}`);
    }
  }
  return { built, skipped };
}

export function generateFluxCandidate({ appDir, asset, direction, familiesById, partsById }) {
  if (asset.canvas.width !== 1024 || asset.canvas.height !== 1024) {
    throw new Error(`The local Flux.2-pro wrapper currently emits 1024x1024 images; ${asset.id} requests ${asset.canvas.width}x${asset.canvas.height}.`);
  }
  const wrapper = resolve(homedir(), '.codex', 'flux2-pro-image.sh');
  if (!existsSync(wrapper)) throw new Error(`Flux.2-pro wrapper not found at ${wrapper}.`);
  const candidateDir = resolveWithin(appDir, 'assets/art-source/candidates');
  const reportDir = resolveWithin(appDir, 'reports/art-pipeline/candidates');
  mkdirSync(candidateDir, { recursive: true });
  mkdirSync(reportDir, { recursive: true });
  const requiresAlpha = asset.outputs.some((output) => output.alpha);
  const requiresComposite = Boolean(asset.composite);
  const candidatePath = nextCandidatePath(candidateDir, asset.id, reportDir);
  const rawCandidatePath = requiresAlpha || requiresComposite ? candidatePath.replace(/\.png$/i, '-raw.png') : candidatePath;
  let basePrompt = asset.composite?.basePrompt || composePrompt(asset, { direction, familiesById, partsById })
    .split('\n')
    .filter((line) => !line.startsWith('Input images:'))
    .join('\n');
  basePrompt = basePrompt
    .replace(/^Asset type: Player Hub mode-card artwork$/m, 'Asset type: text-free cinematic game environment illustration')
    .replaceAll('live interface copy', 'a later HTML overlay')
    .replace(/^Output intent:.*$/m, `Output canvas: exactly ${asset.canvas.width}x${asset.canvas.height}; image only; no title, caption, interface, border, or watermark.`);
  if (requiresAlpha) {
    basePrompt = basePrompt
      .replaceAll('Transparent canvas.', 'Flat uniform pure magenta #FF00FF extraction matte.')
      .replaceAll('genuinely transparent background', 'solid uniform pure magenta #FF00FF background for deterministic extraction');
  }
  const extractionDirective = requiresAlpha
    ? 'BACKGROUND REQUIREMENT: fill every background pixel with flat uniform pure magenta #FF00FF. Do not draw a checkerboard, floor, horizon, vignette, glow, gradient, contact shadow, or environmental reflection. The object must not contain magenta. Every object surface must be blank: no letters, numbers, labels, symbols, logos, or pseudo-text.'
    : '';
  const prompt = asset.composite
    ? basePrompt
    : asset.providerDirectives?.flux2Pro
    ? `Provider priority: ${asset.providerDirectives.flux2Pro}\n${extractionDirective}\n${basePrompt}`
    : `${extractionDirective}\n${basePrompt}`.trim();
  const result = spawnSync('bash', [wrapper, prompt, rawCandidatePath], {
    cwd: appDir,
    encoding: 'utf8',
    maxBuffer: 1024 * 1024,
    windowsHide: true,
  });
  if (result.status !== 0) throw new Error(`Flux.2-pro generation failed for ${asset.id}: ${result.stderr || result.stdout || 'unknown error'}`);
  if (!existsSync(rawCandidatePath)) throw new Error(`Flux.2-pro did not create ${rawCandidatePath}.`);
  if (requiresAlpha) {
    const extractorPath = resolve(appDir, 'scripts', 'matte-to-alpha.py');
    const extraction = spawnSync('python', [extractorPath, rawCandidatePath, candidatePath], {
      cwd: appDir,
      encoding: 'utf8',
      windowsHide: true,
    });
    if (extraction.status !== 0) throw new Error(`Alpha extraction failed for ${asset.id}: ${extraction.stderr || extraction.stdout || 'unknown error'}`);
    const coverage = JSON.parse(extraction.stdout.trim());
    if (coverage.transparentFraction < 0.25 || coverage.opaqueFraction < 0.02) {
      throw new Error(`Alpha extraction for ${asset.id} is implausible: ${extraction.stdout.trim()}`);
    }
  } else if (requiresComposite) {
    composeCandidateImage({ appDir, asset, basePath: rawCandidatePath, candidatePath });
  }
  const dimensions = probeImage(candidatePath);
  if (dimensions.width !== asset.canvas.width || dimensions.height !== asset.canvas.height) {
    throw new Error(`Flux.2-pro returned ${dimensions.width}x${dimensions.height}; expected ${asset.canvas.width}x${asset.canvas.height}.`);
  }
  const record = {
    schemaVersion: 1,
    assetId: asset.id,
    provider: 'Azure AI Foundry',
    model: 'FLUX.2-pro',
    generatedAt: new Date().toISOString(),
    candidate: fileRecord(candidatePath, appDir, dimensions),
    rawCandidate: requiresAlpha || requiresComposite ? fileRecord(rawCandidatePath, appDir, probeImage(rawCandidatePath)) : null,
    prompt,
    manualChecks: asset.manualChecks,
  };
  const recordPath = resolve(reportDir, `${candidateName(candidatePath)}.json`);
  writeFileSync(recordPath, `${JSON.stringify(record, null, 2)}\n`, 'utf8');
  return {
    imagePath: relative(appDir, candidatePath).replaceAll('\\', '/'),
    rawImagePath: requiresAlpha || requiresComposite ? relative(appDir, rawCandidatePath).replaceAll('\\', '/') : null,
    recordPath: relative(appDir, recordPath).replaceAll('\\', '/'),
    dimensions,
  };
}

export function composeCandidateFromBase({ appDir, asset, base }) {
  if (!asset.composite) throw new Error(`${asset.id} does not declare a deterministic composite recipe.`);
  if (!base || basename(base) !== base || !base.startsWith(`${asset.id}-base-`) || !base.endsWith('.png')) {
    throw new Error(`Base must be a ${asset.id}-base-*.png filename from assets/art-source/candidates/.`);
  }
  const candidateDir = resolveWithin(appDir, 'assets/art-source/candidates');
  const reportDir = resolveWithin(appDir, 'reports/art-pipeline/candidates');
  const basePath = resolve(candidateDir, base);
  if (!existsSync(basePath)) throw new Error(`Composite base not found: ${basePath}`);
  const candidatePath = nextCandidatePath(candidateDir, asset.id, reportDir);
  const rawCandidatePath = candidatePath.replace(/\.png$/i, '-raw.png');
  if (existsSync(rawCandidatePath)) throw new Error(`Refusing to overwrite ${rawCandidatePath}.`);
  renameSync(basePath, rawCandidatePath);
  composeCandidateImage({ appDir, asset, basePath: rawCandidatePath, candidatePath });

  const dimensions = probeImage(candidatePath);
  const record = {
    schemaVersion: 1,
    assetId: asset.id,
    provider: 'Azure AI Foundry + Plundrix compositor',
    model: 'FLUX.2-pro',
    generatedAt: new Date().toISOString(),
    candidate: fileRecord(candidatePath, appDir, dimensions),
    rawCandidate: fileRecord(rawCandidatePath, appDir, probeImage(rawCandidatePath)),
    prompt: asset.composite.basePrompt,
    composite: asset.composite,
    manualChecks: asset.manualChecks,
  };
  const recordPath = resolve(reportDir, `${candidateName(candidatePath)}.json`);
  writeFileSync(recordPath, `${JSON.stringify(record, null, 2)}\n`, 'utf8');
  return {
    imagePath: relative(appDir, candidatePath).replaceAll('\\', '/'),
    rawImagePath: relative(appDir, rawCandidatePath).replaceAll('\\', '/'),
    recordPath: relative(appDir, recordPath).replaceAll('\\', '/'),
    dimensions,
  };
}

export function promoteCandidate({ appDir, asset, candidate }) {
  if (!candidate || basename(candidate) !== candidate) {
    throw new Error('Candidate must be a filename from assets/art-source/candidates/.');
  }
  const expected = new RegExp(`^${escapeRegExp(asset.id)}-flux2-pro-v\\d+\\.png$`);
  if (!expected.test(candidate)) throw new Error(`${candidate} is not a versioned candidate for ${asset.id}.`);

  const candidatePath = resolveWithin(appDir, `assets/art-source/candidates/${candidate}`);
  const sourcePath = resolveWithin(appDir, asset.source);
  const requiresAlpha = asset.outputs.some((output) => output.alpha);
  const preservesRaw = requiresAlpha || Boolean(asset.composite);
  const rawCandidatePath = candidatePath.replace(/\.png$/i, '-raw.png');
  const rawSourcePath = preservesRaw
    ? resolveWithin(appDir, `assets/art-source/raw/${basename(rawCandidatePath)}`)
    : null;
  const recordPath = resolveWithin(appDir, `reports/art-pipeline/candidates/${candidateName(candidatePath)}.json`);

  if (!existsSync(candidatePath)) throw new Error(`Candidate not found: ${candidatePath}`);
  if (existsSync(sourcePath)) throw new Error(`Refusing to overwrite existing source: ${asset.source}`);
  if (preservesRaw && !existsSync(rawCandidatePath)) throw new Error(`Preserved raw source is missing: ${rawCandidatePath}`);
  if (rawSourcePath && existsSync(rawSourcePath)) throw new Error(`Refusing to overwrite existing raw source: ${rawSourcePath}`);

  const dimensions = probeImage(candidatePath);
  if (dimensions.width !== asset.canvas.width || dimensions.height !== asset.canvas.height) {
    throw new Error(`${candidate} is ${dimensions.width}x${dimensions.height}; expected ${asset.canvas.width}x${asset.canvas.height}.`);
  }
  if (requiresAlpha && dimensions.pixelFormat !== 'rgba') throw new Error(`${candidate} does not contain the required alpha channel.`);

  mkdirSync(dirname(sourcePath), { recursive: true });
  if (rawSourcePath) mkdirSync(dirname(rawSourcePath), { recursive: true });
  renameSync(candidatePath, sourcePath);
  if (rawSourcePath) renameSync(rawCandidatePath, rawSourcePath);

  let record = {};
  if (existsSync(recordPath)) record = JSON.parse(readFileSync(recordPath, 'utf8'));
  record = {
    ...record,
    lifecycle: 'promoted',
    promotedAt: new Date().toISOString(),
    candidate: fileRecord(sourcePath, appDir, dimensions),
    rawCandidate: rawSourcePath ? fileRecord(rawSourcePath, appDir, probeImage(rawSourcePath)) : null,
    composite: asset.composite || record.composite || null,
  };
  writeFileSync(recordPath, `${JSON.stringify(record, null, 2)}\n`, 'utf8');

  return {
    sourcePath: relative(appDir, sourcePath).replaceAll('\\', '/'),
    rawSourcePath: rawSourcePath ? relative(appDir, rawSourcePath).replaceAll('\\', '/') : null,
    recordPath: relative(appDir, recordPath).replaceAll('\\', '/'),
  };
}

export function writePromptPack({ appDir, assets, direction, familiesById, partsById, version, reportStem = 'prompt-pack' }) {
  const reportDir = resolveWithin(appDir, 'reports/art-pipeline');
  mkdirSync(reportDir, { recursive: true });
  const generatedAt = new Date().toISOString();
  const prompts = assets.map((asset) => {
    const prompt = composePrompt(asset, { direction, familiesById, partsById });
    return {
      id: asset.id,
      label: asset.label,
      status: asset.status,
      family: asset.family,
      source: asset.source,
      prompt,
      generationPrompt: asset.composite?.basePrompt || prompt,
      composite: asset.composite || null,
      manualChecks: asset.manualChecks,
      reviewNote: asset.reviewNote || null,
    };
  });
  const jsonPath = resolve(reportDir, `${reportStem}.json`);
  const markdownPath = resolve(reportDir, `${reportStem}.md`);
  writeFileSync(jsonPath, `${JSON.stringify({ schemaVersion: 1, artSystemVersion: version, generatedAt, prompts }, null, 2)}\n`, 'utf8');
  writeFileSync(markdownPath, renderPromptMarkdown({ prompts, version, generatedAt }), 'utf8');
  return [relative(appDir, markdownPath), relative(appDir, jsonPath)];
}

export function writeInventory({ appDir, assets, inventory, version, reportStem = 'inventory' }) {
  const reportDir = resolveWithin(appDir, 'reports/art-pipeline');
  mkdirSync(reportDir, { recursive: true });
  const generatedAt = new Date().toISOString();
  const enriched = inventory.map((row) => ({
    ...row,
    family: assets.find((asset) => asset.id === row.id)?.family,
  }));
  const jsonPath = resolve(reportDir, `${reportStem}.json`);
  const markdownPath = resolve(reportDir, `${reportStem}.md`);
  writeFileSync(jsonPath, `${JSON.stringify({ schemaVersion: 1, artSystemVersion: version, generatedAt, assets: enriched }, null, 2)}\n`, 'utf8');
  writeFileSync(markdownPath, renderInventoryMarkdown({ rows: enriched, version, generatedAt }), 'utf8');
  return [relative(appDir, markdownPath), relative(appDir, jsonPath)];
}

function buildFfmpegArgs({ output, sourcePath, outputPath, appDir }) {
  const filters = output.treatment === 'social-card-v1'
    ? socialCardFilters(output, appDir)
    : standardFilters(output);
  const codec = output.format === 'webp'
    ? ['-c:v', 'libwebp', '-quality', String(output.quality), '-compression_level', '6']
    : output.format === 'png'
      ? ['-c:v', 'png']
      : ['-q:v', String(jpegQuality(output.quality))];
  return ['-y', '-v', 'error', '-i', sourcePath, '-vf', filters.join(','), '-frames:v', '1', ...codec, outputPath];
}

function composeCandidateImage({ appDir, asset, basePath, candidatePath }) {
  const compositorPath = resolve(appDir, 'scripts', 'compose-parts.py');
  const partPath = resolveWithin(appDir, asset.composite.part);
  const positions = asset.composite.positions.map(([x, y]) => `${x},${y}`).join(';');
  const clones = (asset.composite.clones || []).flatMap((clone) => [
    '--clone',
    [...clone.from, ...clone.to].join(','),
  ]);
  const composition = spawnSync('python', [
    compositorPath,
    basePath,
    candidatePath,
    '--part', partPath,
    '--size', String(asset.composite.size),
    '--positions', positions,
    ...clones,
  ], { cwd: appDir, encoding: 'utf8', windowsHide: true });
  if (composition.status !== 0) throw new Error(`Part composition failed for ${asset.id}: ${composition.stderr || composition.stdout || 'unknown error'}`);
  const result = JSON.parse(composition.stdout.trim());
  if (result.placements !== asset.composite.positions.length) throw new Error(`Part composition placed ${result.placements} items; expected ${asset.composite.positions.length}.`);
}

function standardFilters(output) {
  const scaleMode = output.fit === 'contain' ? 'decrease' : 'increase';
  const filters = [`scale=${output.width}:${output.height}:force_original_aspect_ratio=${scaleMode}`];
  if (output.fit === 'contain') filters.push(`pad=${output.width}:${output.height}:(ow-iw)/2:(oh-ih)/2:color=0x00000000`);
  else filters.push(`crop=${output.width}:${output.height}`);
  if (output.alpha) filters.push('format=rgba');
  return filters;
}

function socialCardFilters(output, appDir) {
  const fontPath = chooseFont(appDir);
  const drawText = (value, size, y, color = '0xf5f1eb') => (
    `drawtext=fontfile='${escapeFilterValue(fontPath)}':text='${escapeFilterValue(value)}':fontcolor=${color}:fontsize=${size}:x=70:y=${y}`
  );
  return [
    `scale=${output.width}:${output.height}:force_original_aspect_ratio=increase`,
    `crop=${output.width}:${output.height}`,
    'eq=brightness=-0.1:saturation=0.92',
    `drawbox=x=0:y=0:w=760:h=${output.height}:color=0x08090d@0.78:t=fill`,
    drawText(output.copy.eyebrow, 34, 62, '0xe8b078'),
    drawText(output.copy.headline[0], 78, 180),
    drawText(output.copy.headline[1], 78, 266),
    'drawbox=x=70:y=430:w=88:h=3:color=0xe8b078@1:t=fill',
    drawText(output.copy.footer, 28, 472, '0xb9b7c6'),
  ];
}

function chooseFont(appDir) {
  const candidates = [
    'C:/Windows/Fonts/bahnschrift.ttf',
    resolve(appDir, 'node_modules/@fontsource/barlow-condensed/files/barlow-condensed-latin-700-normal.woff'),
  ];
  const font = candidates.find((candidate) => existsSync(candidate));
  if (!font) throw new Error('No social-card font found. Install frontend dependencies or provide Bahnschrift.');
  return font;
}

function escapeFilterValue(value) {
  return String(value).replaceAll('\\', '/').replace(':', '\\:').replaceAll("'", "\\'");
}

function jpegQuality(quality) {
  return Math.max(2, Math.min(12, Math.round(2 + ((100 - quality) * 0.3))));
}

function nextCandidatePath(candidateDir, assetId, reportDir) {
  let version = 1;
  while (true) {
    const path = resolve(candidateDir, `${assetId}-flux2-pro-v${version}.png`);
    const recordPath = reportDir ? resolve(reportDir, `${assetId}-flux2-pro-v${version}.json`) : null;
    if (!existsSync(path) && (!recordPath || !existsSync(recordPath))) return path;
    version += 1;
  }
}

function candidateName(path) {
  return path.split(/[\\/]/).pop().replace(/\.png$/i, '');
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function probeJpeg(data, path) {
  let offset = 2;
  while (offset + 8 < data.length) {
    if (data[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = data[offset + 1];
    if (marker === 0xd9 || marker === 0xda) break;
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      offset += 2;
      continue;
    }
    const length = data.readUInt16BE(offset + 2);
    const isStartOfFrame = marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker);
    if (isStartOfFrame) {
      return { width: data.readUInt16BE(offset + 7), height: data.readUInt16BE(offset + 5), pixelFormat: 'rgb' };
    }
    offset += 2 + length;
  }
  throw new Error(`Could not read JPEG dimensions for ${path}.`);
}

function probeWebp(data, path) {
  let offset = 12;
  while (offset + 8 <= data.length) {
    const chunk = data.toString('ascii', offset, offset + 4);
    const length = data.readUInt32LE(offset + 4);
    const payload = offset + 8;
    if (chunk === 'VP8X' && payload + 10 <= data.length) {
      const alpha = (data[payload] & 0x10) !== 0;
      return { width: 1 + data.readUIntLE(payload + 4, 3), height: 1 + data.readUIntLE(payload + 7, 3), pixelFormat: alpha ? 'rgba' : 'rgb' };
    }
    if (chunk === 'VP8L' && payload + 5 <= data.length && data[payload] === 0x2f) {
      const bits = data.readUInt32LE(payload + 1);
      return { width: 1 + (bits & 0x3fff), height: 1 + ((bits >>> 14) & 0x3fff), pixelFormat: (bits & 0x10000000) ? 'rgba' : 'rgb' };
    }
    if (chunk === 'VP8 ' && payload + 10 <= data.length) {
      return { width: data.readUInt16LE(payload + 6) & 0x3fff, height: data.readUInt16LE(payload + 8) & 0x3fff, pixelFormat: 'rgb' };
    }
    offset = payload + length + (length % 2);
  }
  throw new Error(`Could not read WebP dimensions for ${path}.`);
}

function resolveWithin(root, path) {
  const resolvedRoot = resolve(root);
  const resolvedPath = resolve(resolvedRoot, path);
  if (resolvedPath !== resolvedRoot && !resolvedPath.startsWith(`${resolvedRoot}${sep}`)) {
    throw new Error(`Path escapes app root: ${path}`);
  }
  return resolvedPath;
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function fileRecord(path, appDir, dimensions) {
  const data = readFileSync(path);
  return {
    path: relative(appDir, path).replaceAll('\\', '/'),
    width: dimensions.width,
    height: dimensions.height,
    pixelFormat: dimensions.pixelFormat,
    bytes: data.byteLength,
    sha256: createHash('sha256').update(data).digest('hex'),
  };
}

function renderPromptMarkdown({ prompts, version, generatedAt }) {
  const sections = prompts.map((item) => [
    `## ${item.label}`,
    '',
    `- ID: \`${item.id}\``,
    `- Family: \`${item.family}\``,
    `- Status: \`${item.status}\``,
    `- Intended source: \`${item.source}\``,
    ...(item.reviewNote ? [`- Open review: ${item.reviewNote}`] : []),
    ...(item.composite ? [`- Deterministic composition: ${item.composite.positions.length} instances of \`${item.composite.part}\` at ${item.composite.size}px`] : []),
    '',
    ...(item.composite ? ['Generation-stage prompt:', ''] : []),
    '```text',
    item.generationPrompt,
    '```',
    ...(item.composite ? ['', 'Final creative brief:', '', '```text', item.prompt, '```'] : []),
    '',
    'Acceptance checks:',
    '',
    ...item.manualChecks.map((check) => `- [${item.status === 'accepted' ? 'x' : ' '}] ${check}`),
  ].join('\n')).join('\n\n');
  return `# Plundrix Art Prompt Pack\n\nArt system: ${version}\n\nGenerated: ${generatedAt}\n\nGenerate one asset at a time. Save an accepted master at the intended source path, then run the build and validation commands.\n\n${sections}\n`;
}

function renderInventoryMarkdown({ rows, version, generatedAt }) {
  const tableRows = rows.map((row) => {
    const source = row.source ? `${row.source.width}x${row.source.height}, ${formatBytes(row.source.bytes)}, \`${row.source.sha256.slice(0, 12)}\`` : 'not generated';
    const outputs = row.outputs.length
      ? row.outputs.map((output) => `${output.width}x${output.height}, ${formatBytes(output.bytes)}, \`${output.sha256.slice(0, 12)}\``).join('<br>')
      : 'not built';
    return `| ${row.id} | ${row.family} | ${row.status} | ${source} | ${outputs} |`;
  });
  return [
    '# Plundrix Art Inventory',
    '',
    `Art system: ${version}`,
    '',
    `Generated: ${generatedAt}`,
    '',
    '| Asset | Family | State | Master | Delivery |',
    '| --- | --- | --- | --- | --- |',
    ...tableRows,
    '',
    'Full hashes and exact file paths are available in `inventory.json`.',
    '',
  ].join('\n');
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}
