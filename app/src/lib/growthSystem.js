function finite(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function rate(numerator, denominator) {
  return denominator > 0 ? Math.round((numerator / denominator) * 1000) / 10 : null;
}

export function validateGrowthStrategy(strategy, campaigns) {
  const errors = [];
  if (strategy?.schemaVersion !== 1) errors.push('Growth strategy schemaVersion must be 1.');
  if (strategy?.operatingMode !== 'solo') errors.push('Growth strategy must preserve solo operating mode.');
  if (strategy?.maxActiveExperiments !== 1) errors.push('Only one active growth experiment is allowed.');

  const metricIds = new Set();
  for (const metric of strategy?.metrics || []) {
    if (!metric.id || metricIds.has(metric.id)) errors.push(`Duplicate or missing metric id: ${metric.id || '(missing)'}.`);
    metricIds.add(metric.id);
    if (!['at-least', 'at-most', 'exactly'].includes(metric.direction)) errors.push(`${metric.id} has an invalid direction.`);
    if (!Number.isFinite(Number(metric.target))) errors.push(`${metric.id} needs a numeric target.`);
  }

  const routeUrls = new Set();
  for (const route of strategy?.routeIntents || []) {
    if (!/^https:\/\//.test(route.url || '')) errors.push(`Route intent needs an HTTPS URL: ${route.url || '(missing)'}.`);
    if (routeUrls.has(route.url)) errors.push(`Duplicate route intent: ${route.url}.`);
    routeUrls.add(route.url);
    for (const field of ['owner', 'intent', 'audience', 'promise', 'proof', 'cta']) {
      if (!String(route[field] || '').trim()) errors.push(`${route.url || 'Route'} is missing ${field}.`);
    }
  }

  const campaignIds = new Set();
  for (const campaign of campaigns?.campaigns || []) {
    if (!campaign.id || campaignIds.has(campaign.id)) errors.push(`Duplicate or missing campaign id: ${campaign.id || '(missing)'}.`);
    campaignIds.add(campaign.id);
    if (!metricIds.has(campaign.primaryMetric)) errors.push(`${campaign.id} references unknown metric ${campaign.primaryMetric}.`);
    if (!/^https:\/\//.test(campaign.destination || '')) errors.push(`${campaign.id} needs an HTTPS destination.`);
  }
  return { ok: errors.length === 0, errors };
}

export function buildTrackedUrl(campaign, destination = campaign?.destination) {
  if (!campaign) throw new Error('A known campaign is required.');
  const url = new URL(destination);
  const values = {
    utm_source: campaign.source,
    utm_medium: campaign.medium,
    utm_campaign: campaign.campaign,
    utm_content: campaign.creative,
  };
  for (const [key, value] of Object.entries(values)) {
    if (value) url.searchParams.set(key, value);
  }
  return url.toString();
}

export function normalizeGrowthMetrics(payload = {}) {
  const search = payload.searchConsole || {};
  const plausible = payload.plausible || {};
  return {
    'valid-index-rate': {
      value: rate(finite(search.validIndexedUrls), finite(search.submittedPublicUrls)),
      sampleSize: finite(search.submittedPublicUrls),
    },
    'nonbrand-organic-clicks': {
      value: Number.isFinite(Number(search.nonBrandClicks)) ? finite(search.nonBrandClicks) : null,
      sampleSize: Number.isFinite(Number(search.nonBrandClicks)) ? 1 : 0,
    },
    'marketing-handoff-rate': {
      value: rate(finite(plausible.playerHubHandoffs), finite(plausible.marketingVisitors)),
      sampleSize: finite(plausible.marketingVisitors),
    },
    'handoff-start-rate': {
      value: rate(finite(plausible.instantMatchStarts), finite(plausible.attributedPlayerHubLandings)),
      sampleSize: finite(plausible.attributedPlayerHubLandings),
    },
    'source-match-completion-rate': {
      value: rate(finite(plausible.instantMatchCompletions), finite(plausible.instantMatchStarts)),
      sampleSize: finite(plausible.instantMatchStarts),
    },
    'share-rate': {
      value: rate(finite(plausible.challengeShares), finite(plausible.instantMatchCompletions)),
      sampleSize: finite(plausible.instantMatchCompletions),
    },
  };
}

function metricState(definition, measurement) {
  if (!measurement || measurement.value === null || measurement.sampleSize < definition.minimumSample) return 'needs-data';
  if (definition.direction === 'at-most') return measurement.value <= definition.target ? 'pass' : 'fail';
  if (definition.direction === 'exactly') return measurement.value === definition.target ? 'pass' : 'fail';
  return measurement.value >= definition.target ? 'pass' : 'fail';
}

export function buildGrowthSnapshot({ strategy, campaigns, metrics = null, audit = null, generatedAt = new Date().toISOString() }) {
  const validation = validateGrowthStrategy(strategy, campaigns);
  const normalized = metrics ? normalizeGrowthMetrics(metrics) : {};
  const scorecard = (strategy.metrics || []).map((definition) => ({
    ...definition,
    ...(normalized[definition.id] || { value: null, sampleSize: 0 }),
    state: metricState(definition, normalized[definition.id]),
  }));
  const auditFailures = audit?.summary?.failures || 0;
  const failedMetrics = scorecard.filter((item) => item.state === 'fail');
  const missingMetrics = scorecard.filter((item) => item.state === 'needs-data');
  const nextAction = auditFailures
    ? `Repair ${auditFailures} production discovery failure${auditFailures === 1 ? '' : 's'} before publishing more pages.`
    : failedMetrics.length
      ? `Run one experiment against ${failedMetrics[0].label}.`
      : missingMetrics.length
        ? `Import Search Console and Plausible aggregates for ${missingMetrics[0].label}.`
        : 'Keep the current system stable and review the next evidence-backed query opportunity.';
  return {
    schemaVersion: 1,
    generatedAt,
    operatingMode: strategy.operatingMode,
    validation,
    audit: audit?.summary || null,
    scorecard,
    campaigns: campaigns.campaigns || [],
    nextAction,
  };
}

export function exportGrowthMarkdown(snapshot) {
  const rows = snapshot.scorecard.map((metric) => `| ${metric.label} | ${metric.state} | ${metric.value ?? '-'} | ${metric.target} ${metric.unit} | ${metric.sampleSize} |`);
  return [
    '# Plundrix Growth Review',
    '',
    `Generated: ${snapshot.generatedAt}`,
    `Operating mode: ${snapshot.operatingMode}`,
    '',
    '## Do this next',
    '',
    `**${snapshot.nextAction}**`,
    '',
    'Keep one experiment active. Spend no more than 30 minutes on review; spend the rest making, distributing, or observing.',
    '',
    '## Discovery health',
    '',
    snapshot.audit ? `- ${snapshot.audit.passed}/${snapshot.audit.total} checks passed; ${snapshot.audit.failures} failed.` : '- No production crawl imported.',
    '',
    '## Funnel scorecard',
    '',
    '| Metric | State | Latest | Target | Sample |',
    '| --- | --- | ---: | ---: | ---: |',
    ...rows,
    '',
    '## Campaign registry',
    '',
    ...snapshot.campaigns.map((campaign) => `- **${campaign.id}** - ${campaign.status}; ${campaign.source}/${campaign.medium}; metric: ${campaign.primaryMetric}.`),
    '',
  ].join('\n');
}
