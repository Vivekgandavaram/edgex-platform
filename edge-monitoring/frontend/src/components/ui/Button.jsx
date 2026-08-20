import clsx from 'clsx';

const VARIANTS = {
  primary: 'bg-gradient-blue-cyan text-white shadow-glow hover:brightness-110',
  ghost: 'border border-border bg-white/[0.03] text-ink hover:bg-white/[0.06]',
  danger: 'border border-crimson/30 bg-crimson/10 text-crimson hover:bg-crimson/15',
  subtle: 'text-muted hover:text-ink',
};

export default function Button({ variant = 'primary', className, children, ...rest }) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none',
        VARIANTS[variant],
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
