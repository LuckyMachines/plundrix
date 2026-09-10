import { Link } from 'react-router-dom';
import { PRODUCT_LOOP, ROUTE_CLASSES, routeMeta } from '../../data/productSpine';
import { PageShell, Stack } from '../layout/LayoutPrimitives';
import Seo from '../seo/Seo';

export function PageIntro({
  route,
  eyebrow,
  title,
  description,
  primaryAction,
  secondaryAction,
  loopStep,
}) {
  const meta = routeMeta(route) || {};
  const activeStep = loopStep || meta.loopStep;
  const routeClass = ROUTE_CLASSES[meta.routeClass] || meta.routeClass || 'Workbench UI';

  return (
    <section className="cohesion-intro">
      <div className="min-w-0">
        <p className="label">{eyebrow || `${routeClass}${activeStep ? ` / ${activeStep}` : ''}`}</p>
        <h1 className="type-section mt-2 text-vault-text" data-type-contract>{title || meta.title}</h1>
        <p className="type-body measure-copy mt-2 text-vault-text-dim" data-type-contract>
          {description || meta.description}
        </p>
      </div>
      {(primaryAction || secondaryAction) && (
        <div className="flex flex-wrap gap-2">
          {primaryAction}
          {secondaryAction}
        </div>
      )}
    </section>
  );
}

export function ProductLoopRail({ activeStep, compact = false }) {
  return (
    <nav className={`cohesion-loop ${compact ? 'cohesion-loop-compact' : ''}`} aria-label="Product loop">
      {PRODUCT_LOOP.map((step, index) => {
        const active = step.id === activeStep;
        return (
          <Link
            key={step.id}
            to={step.route}
            aria-current={active ? 'step' : undefined}
            className={`cohesion-loop-step ${active ? 'cohesion-loop-step-active' : ''}`}
          >
            <span className="font-mono text-micro uppercase tracking-interface text-vault-text-dim">
              {String(index + 1).padStart(2, '0')}
            </span>
            <span className="font-mono text-xs uppercase tracking-interface">{step.label}</span>
            {!compact && <span className="text-xs leading-5 text-vault-text-dim">{step.summary}</span>}
          </Link>
        );
      })}
    </nav>
  );
}

export function CohesionLayout({ route, children, actions, showLoop = true }) {
  const meta = routeMeta(route) || {};
  return (
    <PageShell className="py-6">
      <Seo title={meta.title} description={meta.description} path={route} />
      <Stack as="section" space="var(--layout-section-gap)">
        <PageIntro route={route} primaryAction={actions?.primary} secondaryAction={actions?.secondary} />
        {showLoop && meta.loopStep && <ProductLoopRail activeStep={meta.loopStep} compact />}
        {children}
        <NextStepRail route={route} />
      </Stack>
    </PageShell>
  );
}

export function NextStepRail({ route }) {
  const meta = routeMeta(route);
  if (!meta?.nextRoutes?.length) return null;
  return (
    <section className="cohesion-next">
      <p className="label">Next useful step</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {meta.nextRoutes.map((path) => {
          const next = routeMeta(path);
          return (
            <Link key={path} to={path} className="cohesion-next-link">
              {next?.label || path}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
