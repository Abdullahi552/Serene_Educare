import { Loader2 } from 'lucide-react';
import { cx } from '@/lib/format';

const VARIANTS = {
  primary: 'bg-brand text-white hover:bg-brand-dark',
  dark: 'bg-brand-dark text-white hover:bg-brand-deep',
  soft: 'bg-mint-100 text-brand-dark shadow-soft hover:bg-mint-150',
  outline: 'border border-line bg-white text-ink hover:bg-mint-50',
  ghost: 'text-ink hover:bg-mint-50',
  danger: 'bg-danger-soft text-danger-ink hover:bg-danger-bg',
  white: 'bg-white text-brand-dark hover:bg-mint-50',
};
const SIZES = { sm: 'h-8 gap-1.5 px-3.5 text-xs', md: 'h-10 gap-2 px-5 text-sm', lg: 'h-12 gap-2 px-7 text-[15px]', xl: 'h-14 gap-2 px-8 text-base' };

export default function Button({ variant = 'primary', size = 'md', loading = false, icon: Icon, className, children, disabled, type = 'button', ...props }) {
  return (
    <button
      type={type} disabled={disabled || loading}
      className={cx('inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-full font-semibold transition disabled:cursor-not-allowed disabled:opacity-55', VARIANTS[variant], SIZES[size], className)}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : Icon ? <Icon className="h-4 w-4" /> : null}
      {children}
    </button>
  );
}

export function IconButton({ icon: Icon, label, className, ...props }) {
  return (
    <button type="button" aria-label={label} title={label} className={cx('inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-brand transition hover:bg-mint-100', className)} {...props}>
      <Icon className="h-5 w-5" />
    </button>
  );
}
