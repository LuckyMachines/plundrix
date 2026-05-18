import { Link } from 'react-router-dom';
import Seo from '../components/seo/Seo';
import { PageIntro, ProductLoopRail } from '../components/cohesion/CohesionLayout';
import {
  COMPARISON_PAGES,
  SITE_ORIGIN,
  comparisonUrl,
} from '../data/comparisonPages';

export default function CompareIndexPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Plundrix game comparisons',
    description: 'Comparison pages for players looking for Plundrix alternatives to raid games, online board games, sabotage games, and onchain games.',
    url: `${SITE_ORIGIN}/compare`,
    hasPart: COMPARISON_PAGES.map((page) => ({
      '@type': 'WebPage',
      name: page.metaTitle,
      url: `${SITE_ORIGIN}${comparisonUrl(page.slug)}`,
      description: page.metaDescription,
    })),
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
      <Seo
        title="Game Comparisons and Alternatives | Plundrix"
        description="Compare Plundrix with raid games, online board games, sabotage games, and onchain strategy games to find the right short-session vault-heist game."
        path="/compare"
        jsonLd={jsonLd}
      />

      <section className="grid gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(340px,0.55fr)] lg:items-end">
        <PageIntro
          route="/compare"
          title="Find the right Plundrix comparison by player craving."
          description="Compare Plundrix against adjacent games by intent: raid pressure, board-game strategy, sabotage, and onchain play."
        />

        <aside className="border border-vault-border bg-vault-surface p-5">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-vault-text-dim">
            Best first reads
          </p>
          <div className="mt-4 grid gap-2">
            {COMPARISON_PAGES.slice(0, 4).map((page) => (
              <Link
                key={page.slug}
                to={comparisonUrl(page.slug)}
                className="flex min-h-[44px] items-center justify-between gap-3 rounded border border-vault-border bg-vault-dark/45 px-3 py-2 text-sm text-vault-text transition-colors hover:border-tungsten/60 hover:text-tungsten"
              >
                <span>{page.title}</span>
                <span className="font-mono text-xs text-vault-text-dim">Read</span>
              </Link>
            ))}
          </div>
        </aside>
      </section>
      <div className="mt-6">
        <ProductLoopRail activeStep="play" compact />
      </div>

      <section className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {COMPARISON_PAGES.map((page) => (
          <Link
            key={page.slug}
            to={comparisonUrl(page.slug)}
            className="group flex min-h-[260px] flex-col border border-vault-border bg-vault-surface p-5 transition-colors hover:border-tungsten/70"
          >
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-oxide-green">
              {page.eyebrow}
            </p>
            <h2 className="mt-3 font-display text-xl font-semibold uppercase tracking-[0.12em] text-vault-text group-hover:text-tungsten">
              {page.title}
            </h2>
            <p className="mt-3 text-sm leading-6 text-vault-text-dim">
              {page.summary}
            </p>
            <div className="mt-auto pt-5 font-mono text-xs uppercase tracking-[0.16em] text-tungsten">
              Compare {page.competitor}
            </div>
          </Link>
        ))}
      </section>
    </div>
  );
}
