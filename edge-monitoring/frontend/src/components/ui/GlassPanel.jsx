import clsx from 'clsx';

// Base floating-glass surface used throughout EdgeX. `strong` bumps opacity/blur
// for elevated content (modals, active nav items); `glow` adds an ambient
// accent glow behind the panel for emphasis (e.g. primary dashboard metrics).
export default function GlassPanel({ as: Tag = 'div', strong = false, glow = null, className, children, ...rest }) {
  return (
    <Tag
      className={clsx(
        'relative rounded-2xl',
        strong ? 'glass-panel-strong' : 'glass-panel',
        className
      )}
      {...rest}
    >
      {glow && (
        <div
          aria-hidden
          className={clsx('pointer-events-none absolute -inset-px rounded-2xl opacity-20 blur-2xl', glow)}
        />
      )}
      <div className="relative">{children}</div>
    </Tag>
  );
}
