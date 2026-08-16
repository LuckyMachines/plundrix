import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { SITE_ORIGIN } from '../../data/comparisonPages';

function upsertMeta(selector, createAttributes, valueAttributes) {
  let element = document.head.querySelector(selector);
  if (!element) {
    element = document.createElement('meta');
    Object.entries(createAttributes).forEach(([key, value]) => element.setAttribute(key, value));
    document.head.appendChild(element);
  }
  Object.entries(valueAttributes).forEach(([key, value]) => element.setAttribute(key, value));
}

function upsertLink(rel, href) {
  let element = document.head.querySelector(`link[rel="${rel}"]`);
  if (!element) {
    element = document.createElement('link');
    element.setAttribute('rel', rel);
    document.head.appendChild(element);
  }
  element.setAttribute('href', href);
}

function upsertJsonLd(id, data) {
  let element = document.getElementById(id);
  if (!element) {
    element = document.createElement('script');
    element.id = id;
    element.type = 'application/ld+json';
    document.head.appendChild(element);
  }
  element.textContent = JSON.stringify(data);
}

function removeElement(selector) {
  document.head.querySelector(selector)?.remove();
}

export default function Seo({
  title = 'PLUNDRIX',
  description = 'Plundrix is an onchain vault-heist strategy game with short turn-based sessions, sabotage, replays, and explicit bot play.',
  path,
  type = 'website',
  image = '/images/og/plundrix-home.jpg',
  imageAlt = 'Plundrix simultaneous-action vault-heist strategy game',
  imageWidth = 1200,
  imageHeight = 630,
  imageType = 'image/jpeg',
  video,
  noIndex = false,
  jsonLd,
}) {
  const location = useLocation();
  const canonicalPath = path || location.pathname;
  const canonical = `${SITE_ORIGIN}${canonicalPath}`;
  const fullTitle = title.includes('Plundrix') || title === 'PLUNDRIX' ? title : `${title} | Plundrix`;

  useEffect(() => {
    document.title = fullTitle;
    upsertMeta('meta[name="description"]', { name: 'description' }, { content: description });
    upsertMeta('meta[property="og:title"]', { property: 'og:title' }, { content: fullTitle });
    upsertMeta('meta[property="og:description"]', { property: 'og:description' }, { content: description });
    upsertMeta('meta[property="og:type"]', { property: 'og:type' }, { content: type });
    upsertMeta('meta[property="og:url"]', { property: 'og:url' }, { content: canonical });
    upsertMeta('meta[property="og:site_name"]', { property: 'og:site_name' }, { content: 'Plundrix' });
    upsertMeta('meta[property="og:locale"]', { property: 'og:locale' }, { content: 'en_US' });
    upsertMeta('meta[name="robots"]', { name: 'robots' }, {
      content: noIndex
        ? 'noindex,nofollow'
        : 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1',
    });
    upsertMeta('meta[name="twitter:card"]', { name: 'twitter:card' }, { content: 'summary_large_image' });
    upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title' }, { content: fullTitle });
    upsertMeta('meta[name="twitter:description"]', { name: 'twitter:description' }, { content: description });
    if (image) {
      const imageUrl = image.startsWith('http') ? image : `${SITE_ORIGIN}${image}`;
      upsertMeta('meta[property="og:image"]', { property: 'og:image' }, { content: imageUrl });
      upsertMeta('meta[property="og:image:secure_url"]', { property: 'og:image:secure_url' }, { content: imageUrl });
      upsertMeta('meta[property="og:image:type"]', { property: 'og:image:type' }, { content: imageType });
      upsertMeta('meta[property="og:image:width"]', { property: 'og:image:width' }, { content: String(imageWidth) });
      upsertMeta('meta[property="og:image:height"]', { property: 'og:image:height' }, { content: String(imageHeight) });
      upsertMeta('meta[property="og:image:alt"]', { property: 'og:image:alt' }, { content: imageAlt });
      upsertMeta('meta[name="twitter:image"]', { name: 'twitter:image' }, { content: imageUrl });
      upsertMeta('meta[name="twitter:image:alt"]', { name: 'twitter:image:alt' }, { content: imageAlt });
    } else {
      removeElement('meta[property="og:image"]');
      removeElement('meta[property="og:image:secure_url"]');
      removeElement('meta[property="og:image:type"]');
      removeElement('meta[property="og:image:width"]');
      removeElement('meta[property="og:image:height"]');
      removeElement('meta[property="og:image:alt"]');
      removeElement('meta[name="twitter:image"]');
      removeElement('meta[name="twitter:image:alt"]');
    }
    if (video) {
      const videoUrl = video.startsWith('http') ? video : `${SITE_ORIGIN}${video}`;
      upsertMeta('meta[property="og:video"]', { property: 'og:video' }, { content: videoUrl });
      upsertMeta('meta[property="og:video:secure_url"]', { property: 'og:video:secure_url' }, { content: videoUrl });
      upsertMeta('meta[property="og:video:type"]', { property: 'og:video:type' }, { content: 'video/mp4' });
    } else {
      removeElement('meta[property="og:video"]');
      removeElement('meta[property="og:video:secure_url"]');
      removeElement('meta[property="og:video:type"]');
    }
    upsertLink('canonical', canonical);
    removeElement('#plundrix-static-jsonld');
    if (noIndex) {
      removeElement('#plundrix-jsonld');
    } else {
      upsertJsonLd('plundrix-jsonld', jsonLd || {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: fullTitle,
        description,
        url: canonical,
        isPartOf: {
          '@type': 'WebSite',
          name: 'Plundrix',
          url: `${SITE_ORIGIN}/`,
        },
        inLanguage: 'en',
      });
    }
  }, [canonical, description, fullTitle, image, imageAlt, imageHeight, imageType, imageWidth, jsonLd, noIndex, type, video]);

  return null;
}
