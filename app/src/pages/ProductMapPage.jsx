import { Link } from 'react-router-dom';
import { CohesionLayout, ProductLoopRail } from '../components/cohesion/CohesionLayout';
import { PRODUCT_LOOP, PRODUCT_STATEMENT, routesForLoopStep } from '../data/productSpine';

export default function ProductMapPage() {
  return (
    <CohesionLayout route="/map" showLoop={false}>
      <section className="rounded border border-vault-border bg-vault-surface/75 p-4 sm:p-5">
        <p className="label">One game loop</p>
        <h2 className="mt-2 font-display text-2xl text-vault-text">How Plundrix connects</h2>
        <p className="mt-2 max-w-4xl text-sm leading-6 text-vault-text-dim">
          {PRODUCT_STATEMENT} Start a table, make each round count, review the finish, compare
          results, and come back with a sharper plan for the next vault.
        </p>
        <div className="mt-4">
          <ProductLoopRail activeStep="observe" />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {PRODUCT_LOOP.map((step) => {
          const routes = routesForLoopStep(step.id);
          return (
            <article key={step.id} className="cohesion-card">
              <p className="label">{step.label}</p>
              <h2 className="mt-2 font-display text-xl text-tungsten">{step.summary}</h2>
              <div className="mt-4 grid gap-2">
                {routes.map((route) => (
                  <Link key={route.path} to={route.path} className="cohesion-next-link justify-between">
                    <span>{route.label}</span>
                    <span className="text-vault-text-dim">{route.primaryCta}</span>
                  </Link>
                ))}
              </div>
            </article>
          );
        })}
      </section>
    </CohesionLayout>
  );
}
