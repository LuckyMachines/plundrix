import { Link } from 'react-router-dom';
import { PRODUCT_LOOP, ROUTE_CLASSES, routeMeta } from '../../data/productSpine';
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
        <h1 className="mt-2 font-display text-3xl text-vault-text">{title || meta.title}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-vault-text-dim">
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
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-vault-text-dim">
              {String(index + 1).padStart(2, '0')}
            </span>
            <span className="font-mono text-xs uppercase tracking-[0.12em]">{step.label}</span>
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <Seo title={meta.title} description={meta.description} path={route} />
      <PageIntro route={route} primaryAction={actions?.primary} secondaryAction={actions?.secondary} />
      {showLoop && meta.loopStep && <ProductLoopRail activeStep={meta.loopStep} compact />}
      {children}
      <NextStepRail route={route} />
    </div>
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
