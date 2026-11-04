import { useRef, useState } from 'react';
import { CalendarDays, ChevronDown, Download, FileSpreadsheet, FileText, HeartPulse, Smile, Stethoscope } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import StatTile from '@/components/common/StatTile';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { Field, Input, Select } from '@/components/ui/Field';
import { ErrorState, Skeleton } from '@/components/ui/Feedback';
import { Donut, ImpactLine, TrendBars } from '@/components/charts/Charts';
import { useAsync } from '@/hooks/useAsync';
import { useClickOutside } from '@/hooks/useClickOutside';
import { useToast } from '@/context/ToastContext';
import { reportService } from '@/services/healthService';
import { REPORT_FORMATS, REPORT_TYPES } from '@/lib/constants';
import { saveBlob } from '@/lib/download';
import { cx, daysAgo, formatBytes, formatDate, toDateInput } from '@/lib/format';

const delta = (n, suffix) => (n === 0 ? { text: 'No change vs last month' } : { text: `${n > 0 ? '+' : ''}${n}% ${suffix}`, trend: n > 0 ? 'up' : 'down' });
const range = (from, to) => `${formatDate(`${from}T12:00:00`, { month: 'short', day: 'numeric' })} - ${formatDate(`${to}T12:00:00`, { month: 'short', day: 'numeric', year: 'numeric' })}`;
const BAR_COLORS = ['bg-brand-dark', 'bg-brand', 'bg-[#14B8A6]', 'bg-[#2DD4BF]'];

function ExportModal({ period, onClose, onDone }) {
  const toast = useToast();
  const [type, setType] = useState(REPORT_TYPES[0].value);
  const [format, setFormat] = useState('pdf');
  const [busy, setBusy] = useState(false);
  const go = async () => {
    setBusy(true);
    try {
      const rep = await reportService.generate({ type, format, from: period.from, to: period.to });
      const blob = await reportService.download(rep.id);
      saveBlob(blob, rep.name.replace(/\s+/g, '_') + `.${rep.format}`);
      toast.success('Report generated.');
      onDone();
    } catch (e) { toast.error(e.message); } finally { setBusy(false); }
  };
  return (
    <Modal onClose={onClose} title="Export report" description={range(period.from, period.to)} size="sm" footer={<><Button variant="soft" onClick={onClose}>Cancel</Button><Button icon={Download} loading={busy} onClick={go}>Generate</Button></>}>
      <div className="space-y-4">
        <Field label="Report"><Select value={type} onChange={(e) => setType(e.target.value)}>{REPORT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}</Select></Field>
        <Field label="Format"><Select value={format} onChange={(e) => setFormat(e.target.value)}>{REPORT_FORMATS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}</Select></Field>
      </div>
    </Modal>
  );
}

export default function Reports() {
  const toast = useToast();
  const [period, setPeriod] = useState({ from: daysAgo(29), to: toDateInput() });
  const [rangeOpen, setRangeOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [grain, setGrain] = useState('daily');
  const [showAll, setShowAll] = useState(false);
  const rangeRef = useRef(null);
  useClickOutside(rangeRef, () => setRangeOpen(false), rangeOpen);

  const insights = useAsync(() => reportService.insights(period), [period.from, period.to]);
  const generated = useAsync(() => reportService.listGenerated(), []);
  const d = insights.data;

  const download = async (r) => {
    try { saveBlob(await reportService.download(r.id), r.name.replace(/\s+/g, '_') + `.${r.format}`); } catch (e) { toast.error(e.message); }
  };

  const trendData = d ? (grain === 'daily' ? d.incidentsTrend.daily.map((x) => ({ label: formatDate(`${x.date}T12:00:00`, { month: 'short', day: 'numeric' }), value: x.value })) : d.incidentsTrend.weekly) : [];
  const reports = generated.data?.data || [];

  return (
    <>
      <PageHeader
        title="Reports & Insights" subtitle="Overview of school health trends, safety metrics, and program impacts."
        actions={(
          <>
            <div className="relative" ref={rangeRef}>
              <button onClick={() => setRangeOpen((o) => !o)} className="flex h-10 items-center gap-2 rounded-full border border-line bg-white px-4 text-xs font-medium hover:bg-mint-50" aria-haspopup="dialog"><CalendarDays className="h-4 w-4 text-brand" />{range(period.from, period.to)}<ChevronDown className="h-3.5 w-3.5 text-muted" /></button>
              {rangeOpen && (
                <div className="absolute right-0 top-12 z-20 flex w-72 animate-pop-in flex-col gap-3 rounded-2xl bg-white p-4 shadow-pop ring-1 ring-line">
                  <Field label="From"><Input type="date" value={period.from} max={period.to} onChange={(e) => setPeriod({ ...period, from: e.target.value })} /></Field>
                  <Field label="To"><Input type="date" value={period.to} min={period.from} max={toDateInput()} onChange={(e) => setPeriod({ ...period, to: e.target.value })} /></Field>
                  <div className="flex flex-wrap gap-2">{[['Last 7 days', 6], ['Last 30 days', 29], ['Last 90 days', 89]].map(([l, n]) => <button key={l} onClick={() => { setPeriod({ from: daysAgo(n), to: toDateInput() }); setRangeOpen(false); }} className="rounded-full bg-mint-100 px-3 py-1 text-xs font-semibold text-brand-dark hover:bg-mint-150">{l}</button>)}</div>
                </div>
              )}
            </div>
            <Button variant="dark" icon={Download} onClick={() => setExporting(true)}>Export Report</Button>
          </>
        )}
      />

      {insights.loading && !d ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[110px]" />)}<Skeleton className="h-80 sm:col-span-2 xl:col-span-3" /><Skeleton className="h-80" /></div>
        : insights.error && !d ? <ErrorState error={insights.error} onRetry={insights.reload} />
        : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatTile icon={Stethoscope} label="Total Incidents" value={d.stats.totalIncidents.value} sub={delta(d.stats.totalIncidents.changePercent, 'this month').text} trend={delta(d.stats.totalIncidents.changePercent).trend} />
              <StatTile icon={Smile} label="Hygiene Score" value={`${d.stats.hygieneScore.value}%`} sub="Compliance rate" />
              <StatTile icon={HeartPulse} label="First Aid Cases" value={d.stats.firstAidCases.value} sub={delta(d.stats.firstAidCases.changePercent, 'vs last month').text} trend={delta(d.stats.firstAidCases.changePercent).trend} />
              <StatTile icon={FileText} label="Sick Leave Days" value={d.stats.sickLeaveDays.value} sub={delta(d.stats.sickLeaveDays.changePercent, 'Total Student Days').text} trend={delta(d.stats.sickLeaveDays.changePercent).trend} />
            </div>

            <div className="mt-5 grid gap-5 xl:grid-cols-[2fr_1fr]">
              <section className="card p-5">
                <div className="mb-4 flex items-center justify-between"><h2 className="font-semibold">Health Incidents Trend</h2>
                  <div className="flex gap-1.5">{[['daily', 'Daily'], ['weekly', 'Weekly']].map(([v, l]) => <button key={v} onClick={() => setGrain(v)} aria-pressed={grain === v} className={cx('rounded-full px-3 py-1 text-[11px] font-semibold', grain === v ? 'bg-[#D9F8DD] text-brand-dark' : 'bg-field text-muted')}>{l}</button>)}</div></div>
                <TrendBars data={trendData} />
              </section>
              <section className="card space-y-5 p-5">
                <div><h2 className="mb-4 font-semibold">Hygiene Compliance</h2>
                  <Donut center={`${d.hygieneCompliance.score}%`} segments={[{ label: 'Pass', value: d.hygieneCompliance.pass, color: '#27AB4D' }, { label: 'Warning', value: d.hygieneCompliance.warning, color: '#F0B84B' }, { label: 'Fail', value: d.hygieneCompliance.fail, color: '#EF4444' }]} /></div>
                <div className="border-t border-line pt-4"><h2 className="mb-3 font-semibold">Safety Incidents Location</h2>
                  <ul className="space-y-3">{d.incidentsByLocation.map((l, i) => <li key={l.location}><div className="mb-1 flex justify-between text-xs"><span>{l.location}</span><b>{l.percent}%</b></div><div className="h-1.5 rounded-full bg-field"><div className={cx('h-full rounded-full', BAR_COLORS[i % 4])} style={{ width: `${l.percent}%` }} /></div></li>)}</ul></div>
              </section>
            </div>

            <div className="mt-5 grid gap-5 xl:grid-cols-[1.6fr_1fr]">
              <section className="card p-5">
                <div className="flex items-start justify-between"><div><h2 className="font-semibold">Health Program Impact Over Time</h2><p className="mt-0.5 text-xs text-muted">Attendance and wellness improvements trend.</p></div><span className="rounded-md bg-[#D9F8DD] px-2.5 py-1 text-[11px] font-semibold text-brand-dark">6 Month View</span></div>
                <div className="mt-3"><ImpactLine labels={d.programImpact.labels} values={d.programImpact.values} /></div>
              </section>
              <section className="card p-5">
                <div className="mb-3 flex items-center justify-between"><h2 className="font-semibold">Recent Generated Reports</h2>{reports.length > 3 && <button onClick={() => setShowAll((s) => !s)} className="text-xs font-semibold text-brand hover:underline">{showAll ? 'Show less' : 'View All'}</button>}</div>
                {!reports.length ? <p className="py-6 text-center text-sm text-muted">No reports yet. Use “Export Report” to create one.</p> : (
                  <ul className="divide-y divide-line">
                    {(showAll ? reports : reports.slice(0, 3)).map((r) => (
                      <li key={r.id} className="flex items-center gap-3 py-3">
                        <span className={cx('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', r.format === 'pdf' ? 'bg-danger-bg text-danger' : 'bg-ok-bg text-brand')}>{r.format === 'pdf' ? <FileText className="h-4 w-4" /> : <FileSpreadsheet className="h-4 w-4" />}</span>
                        <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{r.name}</p><p className="text-[11px] text-slate">{formatDate(r.createdAt, { month: 'short', day: 'numeric', year: 'numeric' })} • {r.format.toUpperCase()} • {formatBytes(r.sizeBytes)}</p></div>
                        <button onClick={() => download(r)} aria-label={`Download ${r.name}`} className="rounded-full p-2 text-muted hover:bg-mint-100 hover:text-brand"><Download className="h-4 w-4" /></button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          </>
        )}
      {exporting && <ExportModal period={period} onClose={() => setExporting(false)} onDone={() => { setExporting(false); generated.reload(); }} />}
    </>
  );
}
