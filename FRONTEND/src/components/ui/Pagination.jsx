import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cx } from '@/lib/format';

export default function Pagination({ pagination, onPage, label = 'results' }) {
  if (!pagination) return null;
  const { page, totalPages, total, limit } = pagination;
  const shown = Math.min(total, page * limit);
  const Btn = ({ dir, disabled, onClick }) => (
    <button onClick={onClick} disabled={disabled} aria-label={dir < 0 ? 'Previous page' : 'Next page'} className={cx('flex h-8 w-8 items-center justify-center rounded-full text-muted transition hover:bg-mint-150 disabled:opacity-40')}>
      {dir < 0 ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
    </button>
  );
  return (
    <div className="flex items-center justify-between gap-3 border-t border-line bg-mint-50/60 px-4 py-3 text-xs text-brand-dark">
      <span>Showing {shown} of {total} {label}</span>
      {totalPages > 1 && <div className="flex items-center gap-1"><Btn dir={-1} disabled={page <= 1} onClick={() => onPage(page - 1)} /><Btn dir={1} disabled={page >= totalPages} onClick={() => onPage(page + 1)} /></div>}
    </div>
  );
}
