export function nonBrandClicksFromSearchRows(rows = [], brandTerms = ['plundrix', 'lucky machines', 'rac erverse', 'racerverse']) {
  const normalizedTerms = brandTerms.map((term) => term.toLowerCase().replace(/\s+/g, ' '));
  return Math.round(rows.reduce((total, row) => {
    const query = String(row.keys?.[0] || row.query || '').toLowerCase().replace(/\s+/g, ' ');
    const branded = normalizedTerms.some((term) => query.includes(term));
    return branded ? total : total + (Number(row.clicks) || 0);
  }, 0) * 10) / 10;
}

export function indexCoverageFromSitemaps(payloads = []) {
  return payloads.reduce((totals, payload) => {
    for (const item of payload?.contents || []) {
      if (item.type && item.type !== 'web') continue;
      totals.submittedPublicUrls += Number(item.submitted) || 0;
      totals.validIndexedUrls += Number(item.indexed) || 0;
    }
    return totals;
  }, { submittedPublicUrls: 0, validIndexedUrls: 0 });
}

export function plausibleMetricValue(payload) {
  const first = Array.isArray(payload?.results) ? payload.results[0] : payload?.results;
  const value = Array.isArray(first?.metrics) ? first.metrics[0] : first?.metrics;
  return Number.isFinite(Number(value)) ? Number(value) : null;
}
