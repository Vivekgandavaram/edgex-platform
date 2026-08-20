import GlassPanel from './GlassPanel';

// Beautiful, ambient empty state used any time a real collection is empty.
// Never substitute fabricated rows/values instead of this component.
export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <GlassPanel className="px-8 py-16">
      <div className="flex items-center justify-center gap-5">
        <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-border bg-gradient-blue-cyan/10">
          <div aria-hidden className="absolute inset-0 rounded-2xl bg-gradient-blue-cyan opacity-10 blur-xl" />
          {Icon && (
            <div className="relative flex h-6 w-6 items-center justify-center leading-none text-cyan">
              <Icon className="h-5 w-5 block" strokeWidth={1.5} />
            </div>
          )}
        </div>

        <div className="flex max-w-xl flex-col items-start text-left">
          <h3 className="text-base font-semibold text-ink">{title}</h3>
          {description && <p className="mt-1 max-w-md text-sm text-muted">{description}</p>}
          {action && <div className="mt-3">{action}</div>}
        </div>
      </div>
    </GlassPanel>
  );
}
