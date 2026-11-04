import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CalendarClock, ClipboardCheck, Droplet, EllipsisVertical, LayoutGrid, Megaphone, Plus, Search, ShieldCheck, SlidersHorizontal, Utensils, ClipboardList, ShieldAlert } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import StatTile from '@/components/common/StatTile';
import Avatar from '@/components/common/Avatar';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { Input } from '@/components/ui/Field';
import Tabs from '@/components/ui/Tabs';
import Pagination from '@/components/ui/Pagination';
import { Badge, EmptyState, ErrorState, Skeleton } from '@/components/ui/Feedback';
import { BrandImage } from '@/components/brand/Brand';
import RecordActivityModal from '@/pages/app/RecordActivityModal';
import { useAsync } from '@/hooks/useAsync';
import { useDebounce } from '@/hooks/useDebounce';
import { useClickOutside } from '@/hooks/useClickOutside';
import { useToast } from '@/context/ToastContext';
import { activityService } from '@/services/healthService';
import { ACTIVITY_CATEGORIES } from '@/lib/constants';
import { cx, formatDate } from '@/lib/format';

const CAT = Object.fromEntries(ACTIVITY_CATEGORIES.map((c) => [c.value, c]));
const CAT_ICON = { hygiene: Droplet, nutrition: Utensils, safety: ShieldCheck, event: Megaphone };
const CAT_GRADIENT = { hygiene: 'from-[#8FD6E8] to-[#3FA7C4]', nutrition: 'from-[#9AD77A] to-[#3F8F3A]', safety: 'from-[#F4C26B] to-[#C2750A]', event: 'from-[#B8C9F0] to-[#5B79C9]' };
const TABS = [{ value: '', label: 'All Activities', icon: LayoutGrid }, ...ACTIVITY_CATEGORIES.map((c) => ({ value: c.value, label: c.label, icon: CAT_ICON[c.value] }))];

function RowMenu({ activity, onEdit, onToggle, onDelete }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useClickOutside(ref, () => setOpen(false), open);
  const Item = ({ onClick, danger, children }) => <button role="menuitem" onClick={() => { setOpen(false); onClick(); }} className={cx('w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-mint-50', danger && 'text-danger-ink')}>{children}</button>;
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} aria-label={`Actions for ${activity.title}`} className="rounded-full p-1.5 text-muted hover:bg-mint-100"><EllipsisVertical className="h-4 w-4" /></button>
      {open && (
        <div role="menu" className="absolute right-0 top-8 z-20 w-48 animate-pop-in rounded-xl bg-white p-1.5 shadow-pop ring-1 ring-line">
          <Item onClick={onEdit}>Edit</Item>
          <Item onClick={onToggle}>{activity.status === 'completed' ? 'Mark as pending' : 'Mark as completed'}</Item>
          <Item onClick={onDelete} danger>Delete</Item>
        </div>
      )}
    </div>
  );
}

export default function ActivityTracker() {
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const [tab, setTab] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [page, setPage] = useState(1);
  const [form, setForm] = useState(null); // null | 'new' | activity
  const [toDelete, setToDelete] = useState(null);
  const [busy, setBusy] = useState(false);
  const term = useDebounce(search);
  const filterRef = useRef(null);
  useClickOutside(filterRef, () => setFilterOpen(false), filterOpen);

  useEffect(() => { if (params.get('new')) { setForm('new'); setParams({}, { replace: true }); } }, [params, setParams]);

  const overview = useAsync(() => activityService.overview(), []);
  const list = useAsync(() => activityService.list({ category: tab, search: term, status, page, limit: expanded ? 12 : 5 }), [tab, term, status, page, expanded]);
  const refresh = () => { overview.reload(); list.reload(); };
  const o = overview.data;

  const toggle = async (a) => {
    try { await activityService.update(a.id, { status: a.status === 'completed' ? 'pending' : 'completed' }); refresh(); } catch (e) { toast.error(e.message); }
  };
  const remove = async () => {
    setBusy(true);
    try { await activityService.remove(toDelete.id); toast.success('Activity deleted.'); setToDelete(null); refresh(); } catch (e) { toast.error(e.message); } finally { setBusy(false); }
  };

  return (
    <>
      <PageHeader title="Health Activity Tracker" subtitle="Monitor and log health initiatives across the school" actions={<Button size="lg" icon={Plus} onClick={() => setForm('new')}>Record New Activity</Button>} />

      {overview.loading && !o ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[118px]" />)}</div>
        : overview.error && !o ? <ErrorState error={overview.error} onRetry={overview.reload} />
        : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatTile icon={ClipboardList} label="Total Activities" value={o.stats.totalActivities.value} sub={`+${o.stats.totalActivities.changePercent}% this month`} trend="up" />
            <StatTile icon={ClipboardCheck} iconTone="warn" label="Pending Audits" value={o.stats.pendingAudits.value} sub="Needs attention" />
            <StatTile icon={CalendarClock} label="Upcoming Events" value={o.stats.upcomingEvents.value} sub="Next 7 days" />
            <StatTile icon={Utensils} label="Nutrition Sessions" value={o.stats.nutritionSessions.value} sub={`+${o.stats.nutritionSessions.changePercent}%`} trend="up" />
          </div>
        )}

      <Tabs className="mt-6" tabs={TABS} value={tab} onChange={(v) => { setTab(v); setPage(1); }} />

      {o && (
        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {o.categories.map((c) => {
            const Icon = CAT_ICON[c.category] || ShieldAlert;
            return (
              <button key={c.category} onClick={() => { setTab(c.category); setPage(1); }} className="group card overflow-hidden text-left transition hover:shadow-soft">
                <div className="relative h-[84px]">
                  <BrandImage src={`/brand/activity-${c.category}.jpg`} className="h-full w-full object-cover" fallback={<div className={cx('h-full w-full bg-gradient-to-br', CAT_GRADIENT[c.category])} />} />
                  <span className="absolute -bottom-4 right-4 flex h-9 w-9 items-center justify-center rounded-full bg-white text-brand shadow"><Icon className="h-4 w-4" /></span>
                </div>
                <div className="px-4 pb-4 pt-3"><p className="font-semibold">{c.title}</p><p className={cx('mt-1 text-xs', c.alert ? 'text-danger-ink' : 'text-muted')}>{c.subtitle}</p></div>
              </button>
            );
          })}
        </div>
      )}

      <section className="card mt-6 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
          <h2 className="font-semibold">Recent Activities</h2>
          <div className="flex items-center gap-2">
            <div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" /><Input className="h-9 w-48 rounded-lg bg-field pl-9 text-xs" placeholder="Search logs..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} aria-label="Search logs" /></div>
            <div className="relative" ref={filterRef}>
              <button onClick={() => setFilterOpen((v) => !v)} aria-label="Filter by status" className={cx('flex h-9 w-9 items-center justify-center rounded-lg border border-line text-brand hover:bg-mint-50', status && 'bg-mint-150')}><SlidersHorizontal className="h-4 w-4" /></button>
              {filterOpen && (
                <div className="absolute right-0 top-11 z-20 w-40 animate-pop-in rounded-xl bg-white p-1.5 shadow-pop ring-1 ring-line">
                  {[['', 'All statuses'], ['completed', 'Completed'], ['pending', 'Pending']].map(([v, l]) => <button key={v} onClick={() => { setStatus(v); setPage(1); setFilterOpen(false); }} className={cx('w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-mint-50', status === v && 'font-semibold text-brand')}>{l}</button>)}
                </div>
              )}
            </div>
          </div>
        </div>

        {list.loading && !list.data ? <div className="space-y-2 p-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
          : list.error && !list.data ? <ErrorState error={list.error} onRetry={list.reload} />
          : !list.data.data.length ? <EmptyState icon={ClipboardList} title="No activities found" text="Try a different filter, or record a new activity." />
          : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px]">
                <thead><tr className="bg-mint-50"><th className="th">Activity Name</th><th className="th">Category</th><th className="th">Date</th><th className="th">Assigned To</th><th className="th">Status</th><th className="th w-10" /></tr></thead>
                <tbody>
                  {list.data.data.map((a) => (
                    <tr key={a.id} className="tr">
                      <td className="td font-medium">{a.title}</td>
                      <td className="td"><Badge tone={CAT[a.category]?.tone}>{CAT[a.category]?.short}</Badge></td>
                      <td className="td text-muted">{formatDate(`${a.date}T12:00:00`, { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                      <td className="td">{a.assignee ? <span className="flex items-center gap-2"><Avatar name={a.assignee.name} size={24} />{a.assignee.name}</span> : <span className="text-muted">Unassigned</span>}</td>
                      <td className="td"><span className="flex items-center gap-2 text-xs"><span className={cx('h-2 w-2 rounded-full', a.status === 'completed' ? 'bg-brand' : 'bg-[#A3D900]')} />{a.status === 'completed' ? 'Completed' : 'Pending'}</span></td>
                      <td className="td"><RowMenu activity={a} onEdit={() => setForm(a)} onToggle={() => toggle(a)} onDelete={() => setToDelete(a)} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        {expanded && list.data && <Pagination pagination={list.data.pagination} onPage={setPage} label="activities" />}
        <button onClick={() => { setExpanded((e) => !e); setPage(1); }} className="block w-full border-t border-line bg-mint-50/60 py-3 text-xs font-semibold text-brand hover:bg-mint-100">{expanded ? 'Show fewer' : 'View All Activity Logs'}</button>
      </section>

      {form && <RecordActivityModal activity={form === 'new' ? null : form} onClose={() => setForm(null)} onSaved={() => { setForm(null); refresh(); }} />}
      {toDelete && <ConfirmDialog danger title="Delete this activity?" confirmLabel="Delete" loading={busy} message={`“${toDelete.title}” will be removed from the activity log.`} onClose={() => setToDelete(null)} onConfirm={remove} />}
    </>
  );
}
