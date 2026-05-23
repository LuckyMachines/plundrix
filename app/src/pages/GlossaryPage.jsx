import { Link } from 'react-router-dom';
import { CohesionLayout } from '../components/cohesion/CohesionLayout';
import { CANONICAL_TERMS, CTA_VERBS, MATCH_SIGNAL_TYPES, PRODUCT_STATEMENT } from '../data/productSpine';

export default function GlossaryPage() {
  return (
    <CohesionLayout route="/glossary" showLoop={false}>
      <section className="grid gap-4 lg:grid-cols-[minmax(0,0.7fr)_minmax(320px,0.3fr)]">
        <div className="rounded border border-vault-border bg-vault-surface/75 p-4 sm:p-5">
          <p className="label">Game overview</p>
          <p className="mt-3 max-w-3xl text-lg leading-8 text-vault-text">
            {PRODUCT_STATEMENT}
          </p>
        </div>
        <div className="rounded border border-vault-border bg-vault-surface/75 p-4 sm:p-5">
          <p className="label">Quick actions</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {CTA_VERBS.map((verb) => (
              <span key={verb} className="cohesion-badge border-vault-border text-vault-text bg-vault-dark/35">
                {verb}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded border border-vault-border bg-vault-surface/75 p-4 sm:p-5">
        <p className="label">Game terms</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {CANONICAL_TERMS.map(([term, definition]) => (
            <article key={term} className="cohesion-card">
              <h2 className="font-display text-xl text-tungsten">{term}</h2>
              <p className="mt-2 text-sm leading-6 text-vault-text-dim">{definition}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded border border-vault-border bg-vault-surface/75 p-4 sm:p-5">
        <p className="label">Match signals</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {MATCH_SIGNAL_TYPES.map((type) => (
            <span key={type} className="cohesion-badge border-blueprint/35 text-blueprint bg-blueprint/8">
              {type}
            </span>
          ))}
        </div>
      </section>

      <section className="rounded border border-vault-border bg-vault-surface/75 p-4 sm:p-5">
        <p className="label">Keep your bearings</p>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-vault-text-dim">
          Use this glossary when you want a quick read on the words, actions, and match signals
          you will see across the Plundrix table.
        </p>
        <Link to="/map" className="mt-4 inline-flex min-h-[44px] items-center rounded border border-tungsten/55 px-4 font-mono text-xs uppercase tracking-[0.14em] text-tungsten">
          Open game map
        </Link>
      </section>
    </CohesionLayout>
  );
}
