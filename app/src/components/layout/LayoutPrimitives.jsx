function join(base, className) {
  return className ? `${base} ${className}` : base;
}

export function PageShell({ as: Element = 'div', wide = false, className = '', children, ...props }) {
  return <Element className={join(`l-page${wide ? ' l-page-wide' : ''}`, className)} {...props}>{children}</Element>;
}

export function Stack({ as: Element = 'div', space, className = '', children, style, ...props }) {
  return <Element className={join('l-stack', className)} style={{ ...style, '--stack-space': space }} {...props}>{children}</Element>;
}

export function Cluster({ as: Element = 'div', space, align, justify, className = '', children, style, ...props }) {
  return <Element className={join('l-cluster', className)} style={{ ...style, '--cluster-space': space, '--cluster-align': align, '--cluster-justify': justify }} {...props}>{children}</Element>;
}

export function AutoGrid({ as: Element = 'div', min = '15rem', space, className = '', children, style, ...props }) {
  return <Element className={join('l-grid', className)} style={{ ...style, '--grid-min': min, '--grid-space': space }} {...props}>{children}</Element>;
}

export function Rail({ as: Element = 'div', itemWidth = '17rem', space, className = '', children, style, ...props }) {
  return <Element className={join('l-rail', className)} style={{ ...style, '--rail-item': itemWidth, '--rail-space': space }} {...props}>{children}</Element>;
}

export function DecisionLayout({ primary, action, className = '', ...props }) {
  return (
    <div className="l-decision-frame" {...props}>
      <div className={join('l-decision', className)}>
        <div className="l-decision-primary">{primary}</div>
        <div className="l-decision-action">{action}</div>
      </div>
    </div>
  );
}
