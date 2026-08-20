import { forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import clsx from 'clsx';

// Standard password field with a show/hide toggle — the proven pattern
// (masked by default, explicit reveal, no auto-reveal on focus) used
// consistently across every password field in EdgeX: login, sign up,
// and reset password.
const PasswordInput = forwardRef(function PasswordInput({ label, error, className, ...rest }, ref) {
  const [visible, setVisible] = useState(false);

  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted">{label}</span>}
      <div className="relative">
        <input
          ref={ref}
          type={visible ? 'text' : 'password'}
          className={clsx(
            'w-full rounded-xl border border-border bg-white/[0.04] px-3.5 py-2.5 pr-11 text-sm text-ink placeholder:text-muted/60',
            'focus:border-cyan/50 focus:bg-white/[0.06] focus:outline-none transition-colors',
            error && 'border-crimson/50',
            className
          )}
          {...rest}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setVisible((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
          aria-label={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? <EyeOff className="h-4 w-4" strokeWidth={1.75} /> : <Eye className="h-4 w-4" strokeWidth={1.75} />}
        </button>
      </div>
      {error && <span className="mt-1 block text-xs text-crimson">{error}</span>}
    </label>
  );
});

export default PasswordInput;
