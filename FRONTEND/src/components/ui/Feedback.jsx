import { AlertTriangle, Loader2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import { cx } from '@/lib/format';

export const Spinner = ({ className }) => <Loader2 className={cx('h-5 w-5 animate-spin text-brand', className)} />;
export const FullPageSpinner = () => <div className="flex min-h-screen items-center justify-center bg-page"><Spinner className="h-8 w-8" /></div>;
export const Skeleton = ({ className }) => <div className={cx('animate-pulse rounded-xl bg-mint-150/70', className)} />;

export function EmptyState({ icon: Icon, title, text, action }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      {Icon && <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-mint-150 text-brand"><Icon className="h-6 w-6" /></div>}
      <p className="text-lg font-semibold">{title}</p>
      {text && <p className="mt-1 max-w-sm text-sm text-muted">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ error, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-danger-bg text-danger"><AlertTriangle className="h-6 w-6" /></div>
      <p className="text-lg font-semibold">Something went wrong</p>
      <p className="mt-1 max-w-sm text-sm text-muted">{error?.message || 'Could not load this data.'}</p>
      {onRetry && <Button className="mt-4" variant="outline" onClick={() => onRetry()}>Try again</Button>}
    </div>
  );
}

const TONES = {
  neutral: 'bg-field text-muted',
  ok: 'bg-ok-bg text-ok-ink',
  warn: 'bg-warn-bg text-warn-ink',
  danger: 'bg-danger-bg text-danger-ink',
  info: 'bg-[#E0ECFF] text-[#1D4ED8]',
  mint: 'bg-mint-150 text-brand-dark',
};
export function Badge({ tone = 'neutral', className, children }) {
  return <span className={cx('inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-semibold', TONES[tone], className)}>{children}</span>;
}
