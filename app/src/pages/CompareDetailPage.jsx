import { Link, Navigate, useParams } from 'react-router-dom';
import Seo from '../components/seo/Seo';
import {
  COMPARISON_BY_SLUG,
  COMPARISON_PAGES,
  SITE_ORIGIN,
  absoluteComparisonUrl,
  comparisonUrl,
} from '../data/comparisonPages';

export default function CompareDetailPage() {
  const { slug } = useParams();
  const page = COMPARISON_BY_SLUG[slug];

  if (!page) return <Navigate to="/compare" replace />;

  const related = COMPARISON_PAGES
    .filter((item) => item.slug !== page.slug)
    .filter((item) => item.category === page.category)
    .concat(COMPARISON_PAGES.filter((item) => item.slug !== page.slug && item.category !== page.category))
    .slice(0, 3);
  const jsonLd = buildComparisonJsonLd(page);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
      <Seo
        title={page.metaTitle}
        description={page.metaDescription}
        path={comparisonUrl(page.slug)}
        jsonLd={jsonLd}
      />

      <nav className="mb-8 font-mono text-xs uppercase tracking-[0.16em] text-vault-text-dim">
        <Link to="/compare" className="hover:text-vault-text">Comparisons</Link>
        <span className="px-2">/</span>
        <span className="text-tungsten">{page.competitor}</span>
      </nav>

      <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-oxide-green">
            {page.eyebrow}
          </p>
          <h1 className="mt-3 max-w-5xl font-display text-3xl font-semibold uppercase tracking-[0.16em] text-tungsten sm:text-5xl">
            {page.headline}
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-vault-text-dim">
            {page.summary}
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              to="/"
              className="flex min-h-[44px] items-center rounded border border-tungsten/70 bg-tungsten/10 px-4 py-2 font-mono text-xs uppercase tracking-[0.16em] text-vault-text hover:bg-tungsten/15"
            >
              Play Plundrix
            </Link>
            <Link
              to="/simulator"
              className="flex min-h-[44px] items-center rounded border border-vault-border px-4 py-2 font-mono text-xs uppercase tracking-[0.16em] text-vault-text-dim hover:border-tungsten/60 hover:text-vault-text"
            >
              Open simulator
            </Link>
          </div>
        </div>

        <aside className="border border-vault-border bg-vault-surface p-5">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-vault-text-dim">
            Quick fit
          </p>
          <dl className="mt-4 grid gap-4">
            <FitRow label="Compared with" value={page.competitor} />
            <FitRow label="Category" value={page.category} />
            <FitRow label="Best if you want" value={page.bestFor[0]} />
          </dl>
        </aside>
      </section>

      <section className="mt-10 grid gap-6 lg:grid-cols-2">
        <FitPanel title="Plundrix is a fit if" items={page.bestFor} />
        <FitPanel title="Probably not the fit if" items={page.notFor} muted />
      </section>

      <section className="mt-10 border border-vault-border bg-vault-surface">
        <div className="border-b border-vault-border px-5 py-4">
          <h2 className="font-display text-xl font-semibold uppercase tracking-[0.16em] text-tungsten">
            Side-by-side comparison
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-vault-dark/60 font-mono text-xs uppercase tracking-[0.14em] text-vault-text-dim">
              <tr>
                <th className="px-5 py-3">Dimension</th>
                <th className="px-5 py-3">{page.competitor}</th>
                <th className="px-5 py-3">Plundrix</th>
              </tr>
            </thead>
            <tbody>
              {page.compareRows.map(([dimension, competitor, plundrix]) => (
                <tr key={dimension} className="border-t border-vault-border/70">
                  <th className="px-5 py-4 align-top font-mono text-xs uppercase tracking-[0.12em] text-tungsten">
                    {dimension}
                  </th>
                  <td className="px-5 py-4 align-top leading-6 text-vault-text-dim">{competitor}</td>
                  <td className="px-5 py-4 align-top leading-6 text-vault-text">{plundrix}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(320px,0.45fr)]">
        <div className="border border-vault-border bg-vault-surface p-5">
          <h2 className="font-display text-xl font-semibold uppercase tracking-[0.16em] text-tungsten">
            Why Plundrix is different
          </h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {page.plundrixAdvantages.map((item) => (
              <div key={item} className="border border-vault-border bg-vault-dark/45 p-4">
                <p className="text-sm leading-6 text-vault-text">{item}</p>
              </div>
            ))}
          </div>
        </div>

        <aside className="border border-vault-border bg-vault-surface p-5">
          <h2 className="font-display text-lg font-semibold uppercase tracking-[0.16em] text-tungsten">
            Sources
          </h2>
          <div className="mt-4 grid gap-2">
            {page.sourceLinks.map((source) => (
              <a
                key={source.href}
                href={source.href}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded border border-vault-border bg-vault-dark/45 px-3 py-3 text-sm text-vault-text-dim hover:border-tungsten/60 hover:text-vault-text"
              >
                {source.label}
              </a>
            ))}
          </div>
        </aside>
      </section>

      <section className="mt-10 border border-vault-border bg-vault-surface p-5">
        <h2 className="font-display text-xl font-semibold uppercase tracking-[0.16em] text-tungsten">
          FAQ
        </h2>
        <div className="mt-5 grid gap-4">
          {page.faq.map(([question, answer]) => (
            <details key={question} className="border border-vault-border bg-vault-dark/45 p-4">
              <summary className="cursor-pointer font-mono text-xs uppercase tracking-[0.14em] text-vault-text">
                {question}
              </summary>
              <p className="mt-3 text-sm leading-6 text-vault-text-dim">{answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold uppercase tracking-[0.16em] text-tungsten">
          Related comparisons
        </h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {related.map((item) => (
            <Link
              key={item.slug}
              to={comparisonUrl(item.slug)}
              className="border border-vault-border bg-vault-surface p-4 transition-colors hover:border-tungsten/70"
            >
              <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-oxide-green">
                {item.eyebrow}
              </p>
              <h3 className="mt-2 font-display text-lg uppercase tracking-[0.12em] text-vault-text">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-vault-text-dim">{item.metaDescription}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function FitRow({ label, value }) {
  return (
    <div>
      <dt className="font-mono text-[11px] uppercase tracking-[0.16em] text-vault-text-dim">{label}</dt>
      <dd className="mt-1 text-sm leading-6 text-vault-text">{value}</dd>
    </div>
  );
}

function FitPanel({ title, items, muted = false }) {
  return (
    <section className="border border-vault-border bg-vault-surface p-5">
      <h2 className="font-display text-lg font-semibold uppercase tracking-[0.16em] text-tungsten">
        {title}
      </h2>
      <ul className="mt-4 grid gap-3">
        {items.map((item) => (
          <li key={item} className={`border border-vault-border bg-vault-dark/45 p-3 text-sm leading-6 ${muted ? 'text-vault-text-dim' : 'text-vault-text'}`}>
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}

function buildComparisonJsonLd(page) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        name: page.metaTitle,
        description: page.metaDescription,
        url: absoluteComparisonUrl(page.slug),
        isPartOf: {
          '@type': 'WebSite',
          name: 'Plundrix',
          url: SITE_ORIGIN,
        },
      },
      {
        '@type': 'FAQPage',
        mainEntity: page.faq.map(([question, answer]) => ({
          '@type': 'Question',
          name: question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: answer,
          },
        })),
      },
    ],
  };
}
