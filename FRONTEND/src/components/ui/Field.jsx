import { cloneElement, forwardRef, isValidElement, useId } from 'react';
import { Check } from 'lucide-react';
import { cx } from '@/lib/format';

export function Field({ label, error, hint, required, className, children, htmlFor }) {
  const autoId = useId();
  const id = htmlFor || autoId;
  // Link the label to the control automatically (Input / Select / Textarea passed directly as the child).
  const control = isValidElement(children) && typeof children.type !== 'string' && !children.props.id
    ? cloneElement(children, { id, 'aria-invalid': error ? true : undefined })
    : children;
  return (
    <div className={className}>
      {label && <label htmlFor={id} className="label">{label}{required && <span className="ml-0.5 text-danger">*</span>}</label>}
      {control}
      {error ? <p className="mt-1 text-xs text-danger">{error}</p> : hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

export const Input = forwardRef(function Input({ className, invalid, variant = 'default', ...props }, ref) {
  return <input ref={ref} className={cx(variant === 'field' ? 'input-field' : 'input', invalid && 'input-error', className)} {...props} />;
});

export const Textarea = forwardRef(function Textarea({ className, invalid, rows = 4, ...props }, ref) {
  return <textarea ref={ref} rows={rows} className={cx('input resize-none', invalid && 'input-error', className)} {...props} />;
});

export const Select = forwardRef(function Select({ className, invalid, children, ...props }, ref) {
  return <select ref={ref} className={cx('input pr-8', invalid && 'input-error', className)} {...props}>{children}</select>;
});

export function Checkbox({ checked, onChange, label, className }) {
  return (
    <label className={cx('inline-flex cursor-pointer items-center gap-2 text-xs font-medium text-brand', className)}>
      <span className={cx('flex h-4 w-4 items-center justify-center rounded border transition', checked ? 'border-brand bg-brand text-white' : 'border-line bg-white')}>{checked && <Check className="h-3 w-3" />}</span>
      <input type="checkbox" className="sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

export function Switch({ checked, onChange, label, disabled }) {
  return (
    <button
      type="button" role="switch" aria-checked={checked} aria-label={label} disabled={disabled} onClick={() => onChange(!checked)}
      className={cx('relative h-6 w-11 shrink-0 rounded-full transition disabled:opacity-50', checked ? 'bg-brand' : 'bg-[#dfe5ee]')}
    >
      <span className={cx('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all', checked ? 'left-[22px]' : 'left-0.5')} />
    </button>
  );
}
