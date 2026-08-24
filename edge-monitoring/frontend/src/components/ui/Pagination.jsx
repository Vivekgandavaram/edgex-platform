import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ page, total, limit, onChange }) {
  const pages = Math.max(1, Math.ceil(total / limit));
  if (pages <= 1) return null;

  return (
    <div className="flex items-center justify-between border-t border-border pt-3 text-xs text-muted">
      <span>Page {page} of {pages} · {total} total</span>
      <div className="flex gap-1">
        <button type="button" aria-label="Previous page" disabled={page === 1} onClick={() => onChange(page - 1)} className="rounded-md border border-border p-1.5 hover:text-ink disabled:cursor-not-allowed disabled:opacity-30">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button type="button" aria-label="Next page" disabled={page >= pages} onClick={() => onChange(page + 1)} className="rounded-md border border-border p-1.5 hover:text-ink disabled:cursor-not-allowed disabled:opacity-30">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
