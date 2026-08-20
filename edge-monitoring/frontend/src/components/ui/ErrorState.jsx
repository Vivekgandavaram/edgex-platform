import { AlertTriangle } from 'lucide-react';
import GlassPanel from './GlassPanel';
import Button from './Button';

export default function ErrorState({ title = 'Unable to load this data.', description, onRetry }) {
  return (
    <GlassPanel className="flex flex-col items-center gap-3 px-8 py-12 text-center">
      <AlertTriangle className="h-6 w-6 text-crimson" strokeWidth={1.5} />
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      {description && <p className="max-w-sm text-sm text-muted">{description}</p>}
      {onRetry && <Button variant="ghost" onClick={onRetry} className="mt-2">Try again</Button>}
    </GlassPanel>
  );
}
