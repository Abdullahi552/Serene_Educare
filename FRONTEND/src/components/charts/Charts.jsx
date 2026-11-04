import { cx } from '@/lib/format';

/** Dashboard: 7 bars, filled part = value relative to the busiest day. */
export function WeeklyBars({ data = [] }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <div className="flex h-[200px] items-stretch gap-2.5 sm:gap-4" role="img" aria-label="Health activity over the last 7 days">
      {data.map((d, i) => {
        const pct = Math.round((d.count / max) * 100);
        return (
          <div key={d.date} className="flex min-w-0 flex-1 flex-col items-center gap-2">
            <div className="relative w-full flex-1 overflow-hidden rounded-md bg-[#E0FCE3]" title={`${d.count} activities`}>
              <div className={cx('absolute inset-x-0 bottom-0 rounded-md', pct < 25 ? 'bg-[#9BE0AB]' : 'bg-brand')} style={{ height: `${Math.max(pct, 4)}%` }} />
            </div>
            <span className="text-[11px] text-muted">{new Intl.DateTimeFormat('en-NG', { weekday: 'short' }).format(new Date(`${d.date}T12:00:00`))}</span>
          </div>
        );
      })}
    </div>
  );
}

/** Reports: incident trend bars with y-axis, hover tooltip. data: [{ label, value }] */
export function TrendBars({ data = [], unit = 'Cases' }) {
  const rawMax = Math.max(10, ...data.map((d) => d.value));
  const max = Math.ceil(rawMax / 10) * 10;
  const ticks = [0, 1, 2, 3, 4].map((i) => Math.round((max / 4) * i));
  const every = Math.max(1, Math.ceil(data.length / 7));
  return (
    <div className="flex gap-3" role="img" aria-label="Health incidents trend">
      <div className="flex h-[260px] flex-col-reverse justify-between pb-6 text-[10px] text-muted">{ticks.map((t) => <span key={t}>{t}</span>)}</div>
      <div className="min-w-0 flex-1">
        <div className="relative flex h-[236px] items-end gap-1.5 border-b border-line">
          {[1, 2, 3, 4].map((i) => <span key={i} className="pointer-events-none absolute inset-x-0 border-t border-dashed border-line/70" style={{ bottom: `${i * 25}%` }} />)}
          {data.map((d) => (
            <div key={d.label} className="group relative flex h-full min-w-0 flex-1 items-end">
              <div className="w-full rounded-t-[4px] bg-gradient-to-b from-brand-light to-brand-deep transition group-hover:brightness-110" style={{ height: `${(d.value / max) * 100}%` }} />
              <span className="pointer-events-none absolute -top-7 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-[#888] px-2 py-0.5 text-[10px] text-white group-hover:block">{d.value} {unit}</span>
            </div>
          ))}
        </div>
        <div className="mt-2 flex gap-1.5 text-[10px] text-muted">
          {data.map((d, i) => <span key={d.label} className="min-w-0 flex-1 text-center">{i % every === 0 ? d.label : ''}</span>)}
        </div>
      </div>
    </div>
  );
}

/** Donut with a centre label. segments: [{ label, value, color }] (values are percentages) */
export function Donut({ segments = [], center }) {
  const r = 38;
  const c = 2 * Math.PI * r;
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  let offset = 0;
  return (
    <div className="flex items-center gap-5">
      <div className="relative h-[110px] w-[110px] shrink-0">
        <svg viewBox="0 0 100 100" className="-rotate-90" role="img" aria-label="Hygiene compliance">
          {segments.map((s) => {
            const len = (s.value / total) * c;
            const el = <circle key={s.label} cx="50" cy="50" r={r} fill="none" stroke={s.color} strokeWidth="16" strokeDasharray={`${len} ${c - len}`} strokeDashoffset={-offset} />;
            offset += len;
            return el;
          })}
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-xl font-bold">{center}</span>
      </div>
      <ul className="flex-1 space-y-2.5 text-xs">
        {segments.map((s) => <li key={s.label} className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} /><span className="flex-1 text-slate">{s.label}</span><b>{s.value}%</b></li>)}
      </ul>
    </div>
  );
}

/** Reports: dashed trend line. labels: string[], values: 0-100 */
export function ImpactLine({ labels = [], values = [] }) {
  const W = 640; const H = 150; const padL = 34; const padB = 24;
  const x = (i) => padL + (i * (W - padL - 10)) / Math.max(1, values.length - 1);
  const y = (v) => 8 + ((100 - v) / 100) * (H - padB - 8);
  const pts = values.map((v, i) => `${x(i)},${y(v)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-[170px] w-full" role="img" aria-label="Program impact over time">
      {[0, 50, 100].map((t) => (
        <g key={t}><line x1={padL} x2={W - 10} y1={y(t)} y2={y(t)} stroke="#E7EBF3" strokeDasharray="3 4" /><text x={padL - 6} y={y(t) + 3} textAnchor="end" fontSize="9" fill="#8F8F8F">{t}%</text></g>
      ))}
      <polyline points={pts} fill="none" stroke="#27AB4D" strokeWidth="2" strokeDasharray="4 4" strokeLinejoin="round" />
      {values.map((v, i) => <circle key={i} cx={x(i)} cy={y(v)} r="2.5" fill="#27AB4D" />)}
      {labels.map((l, i) => <text key={l} x={x(i)} y={H - 6} textAnchor="middle" fontSize="9" fill="#8F8F8F">{l}</text>)}
    </svg>
  );
}
