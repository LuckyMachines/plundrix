function decodeEntities(value) {
  return String(value || '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function firstMatch(source, pattern) {
  return decodeEntities(source.match(pattern)?.[1]?.trim() || '');
}

export function extractHtmlFacts(html) {
  const body = firstMatch(html, /<body[^>]*>([\s\S]*?)<\/body>/i);
  const visible = body
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const jsonLd = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)]
    .map((match) => match[1].trim());
  return {
    title: firstMatch(html, /<title[^>]*>([\s\S]*?)<\/title>/i),
    description: firstMatch(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["'][^>]*>/i)
      || firstMatch(html, /<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["'][^>]*>/i),
    canonical: firstMatch(html, /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']*)["'][^>]*>/i)
      || firstMatch(html, /<link[^>]+href=["']([^"']*)["'][^>]+rel=["']canonical["'][^>]*>/i),
    robots: firstMatch(html, /<meta[^>]+name=["']robots["'][^>]+content=["']([^"']*)["'][^>]*>/i),
    h1Count: (body.match(/<h1\b/gi) || []).length,
    linkCount: (body.match(/<a\s/gi) || []).length,
    textLength: visible.length,
    jsonLd,
  };
}

export function extractSitemapEntries(xml) {
  return [...xml.matchAll(/<url>([\s\S]*?)<\/url>/gi)].map((match) => {
    const block = match[1];
    return {
      url: decodeEntities(firstMatch(block, /<loc>(.*?)<\/loc>/i)),
      lastModified: firstMatch(block, /<lastmod>(.*?)<\/lastmod>/i),
    };
  });
}

export function extractAbsoluteUrls(source) {
  return [...new Set([...String(source || '').matchAll(/https:\/\/[^\s)\]<>"']+/g)].map((match) => match[0].replace(/[.,;:]$/, '')))];
}

export function auditHtml({ requestedUrl, finalUrl = requestedUrl, expectedCanonical = requestedUrl, status, headers = {}, html, expectedIndexable = true }) {
  const facts = extractHtmlFacts(html);
  const checks = [];
  const add = (id, ok, detail) => checks.push({ id, ok: Boolean(ok), detail });
  const normalizedExpected = expectedCanonical.replace(/\/$/, '');
  const normalizedCanonical = facts.canonical.replace(/\/$/, '');
  add('status', status >= 200 && status < 400, `HTTP ${status}`);
  add('title', facts.title.length >= 10 && facts.title.length <= 70, `${facts.title.length} characters`);
  add('description', facts.description.length >= 50 && facts.description.length <= 180, `${facts.description.length} characters`);
  add('canonical', normalizedCanonical === normalizedExpected, facts.canonical || 'missing');
  add('robots', expectedIndexable ? !/noindex/i.test(`${facts.robots} ${headers['x-robots-tag'] || ''}`) : /noindex/i.test(`${facts.robots} ${headers['x-robots-tag'] || ''}`), facts.robots || headers['x-robots-tag'] || 'default index');
  if (expectedIndexable) {
    add('h1', facts.h1Count === 1, `${facts.h1Count} h1 elements`);
    add('crawlable-copy', facts.textLength >= 160, `${facts.textLength} visible characters`);
    add('internal-links', facts.linkCount >= 2, `${facts.linkCount} links`);
  }
  add('json-ld', facts.jsonLd.length > 0 && facts.jsonLd.every((value) => {
    try { JSON.parse(value); return true; } catch { return false; }
  }), `${facts.jsonLd.length} blocks`);
  return { requestedUrl, finalUrl, status, facts, checks, ok: checks.every((check) => check.ok) };
}
