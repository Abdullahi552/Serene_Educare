import { cx } from '@/lib/format';

/** Underline tabs, as used on the Activity Tracker and School Profile screens. */
export default function Tabs({ tabs, value, onChange, className }) {
  return (
    <div role="tablist" className={cx('flex gap-1 overflow-x-auto border-b border-line', className)}>
      {tabs.map(({ value: v, label, icon: Icon }) => (
        <button
          key={v} role="tab" aria-selected={value === v} onClick={() => onChange(v)}
          className={cx('-mb-px flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-xs font-semibold transition', value === v ? 'border-brand text-brand-dark' : 'border-transparent text-muted hover:text-ink')}
        >
          {Icon && <Icon className="h-3.5 w-3.5" />}{label}
        </button>
      ))}
    </div>
  );
}

/** Pill filter chips (Training library). */
export function Chips({ items, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map(({ value: v, label }) => (
        <button key={v} onClick={() => onChange(v)} aria-pressed={value === v} className={cx('rounded-full border px-4 py-1.5 text-xs font-semibold transition', value === v ? 'border-brand bg-brand text-white' : 'border-line bg-white text-muted hover:text-ink')}>{label}</button>
      ))}
    </div>
  );
}
