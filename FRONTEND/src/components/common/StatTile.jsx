import { TrendingDown, TrendingUp } from 'lucide-react';
import { cx } from '@/lib/format';

/** Small stat card with an icon chip (Activity Tracker, Reports, Training). */
export default function StatTile({ icon: Icon, iconTone = 'mint', label, value, suffix, sub, trend, children }) {
  const tones = { mint: 'bg-mint-150 text-brand', warn: 'bg-warn-bg text-warn-ink' };
  return (
    <div className="card flex flex-col gap-2.5 p-5">
      <div className="flex items-center gap-3">
        <span className={cx('flex h-9 w-9 items-center justify-center rounded-[10px]', tones[iconTone])}><Icon className="h-[18px] w-[18px]" /></span>
        <p className="text-sm font-medium text-muted">{label}</p>
      </div>
      <p className="text-[28px] font-semibold leading-none">{value}{suffix && <span className="ml-1.5 text-sm font-normal text-muted">{suffix}</span>}</p>
      {children}
      {sub && (
        <p className={cx('flex items-center gap-1 text-xs', trend ? 'font-medium text-brand' : 'text-muted')}>
          {trend === 'up' && <TrendingUp className="h-3.5 w-3.5" />}{trend === 'down' && <TrendingDown className="h-3.5 w-3.5" />}{sub}
        </p>
      )}
    </div>
  );
}
