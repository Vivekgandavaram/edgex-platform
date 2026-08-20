import { forwardRef } from 'react';
import clsx from 'clsx';

const Input = forwardRef(function Input({ label, error, className, ...rest }, ref) {
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted">{label}</span>}
      <input
        ref={ref}
        className={clsx(
          'w-full rounded-xl border border-border bg-white/[0.04] px-3.5 py-2.5 text-sm text-ink placeholder:text-muted/60',
          'focus:border-cyan/50 focus:bg-white/[0.06] focus:outline-none transition-colors',
          error && 'border-crimson/50',
          className
        )}
        {...rest}
      />
      {error && <span className="mt-1 block text-xs text-crimson">{error}</span>}
    </label>
  );
});

export default Input;
