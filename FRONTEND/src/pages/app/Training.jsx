import { useState } from 'react';
import { Award, BadgeCheck, BookOpen, Clock, ExternalLink, FileText, Library, PlayCircle, Presentation, Search, ShieldCheck, ArrowRight, BookMarked } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import StatTile from '@/components/common/StatTile';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { Input } from '@/components/ui/Field';
import { Chips } from '@/components/ui/Tabs';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/Feedback';
import { BrandImage } from '@/components/brand/Brand';
import { useAsync } from '@/hooks/useAsync';
import { useDebounce } from '@/hooks/useDebounce';
import { useToast } from '@/context/ToastContext';
import { trainingService } from '@/services/healthService';
import { COURSE_FILTERS, COURSE_TYPES } from '@/lib/constants';
import { cx } from '@/lib/format';

const TYPE_ICON = { video: PlayCircle, module: BookOpen, presentation: Presentation, guide: BookMarked, document: FileText };
const TYPE_GRADIENT = { video: 'from-[#D6B9A0] to-[#7A5239]', module: 'from-[#C9D4DE] to-[#6C7F92]', presentation: 'from-[#B9E3C4] to-[#4FA86A]', guide: 'from-[#2F3B35] to-[#0F1612]', document: 'from-[#C8D9F0] to-[#5F83BD]' };
const duration = (m) => (m >= 60 ? `${+(m / 60).toFixed(1)} hr${m >= 120 ? 's' : ''}` : `${m} mins`);

function CourseModal({ course, onClose, onChanged }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [c, setC] = useState(course);
  const Icon = TYPE_ICON[c.type] || BookOpen;
  const complete = async () => {
    setBusy(true);
    try { setC(await trainingService.complete(c.id)); toast.success('Course completed. Well done!'); onChanged(); } catch (e) { toast.error(e.message); } finally { setBusy(false); }
  };
  return (
    <Modal onClose={onClose} title={c.title} description={`${COURSE_TYPES[c.type]} • ${duration(c.durationMinutes)}${c.mandatory ? ' • Mandatory' : ''}`} size="sm"
      footer={<>
        {c.contentUrl && <a href={c.contentUrl} target="_blank" rel="noreferrer"><Button variant="outline" icon={ExternalLink}>Open content</Button></a>}
        {c.status !== 'completed' ? <Button icon={BadgeCheck} loading={busy} onClick={complete}>Mark as complete</Button> : <Button variant="soft" onClick={onClose}>Close</Button>}
      </>}>
      <div className="flex items-start gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-mint-150 text-brand"><Icon className="h-5 w-5" /></span><p className="text-sm text-slate">{c.description}</p></div>
      <div className="mt-5"><div className="mb-1 flex justify-between text-xs"><span className="text-muted">Progress</span><b>{c.status === 'completed' ? 100 : c.progressPercent}%</b></div><div className="h-2 rounded-full bg-field"><div className="h-full rounded-full bg-brand transition-all" style={{ width: `${c.status === 'completed' ? 100 : c.progressPercent}%` }} /></div></div>
    </Modal>
  );
}

export default function Training() {
  const toast = useToast();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [all, setAll] = useState(false);
  const [open, setOpen] = useState(null);
  const term = useDebounce(search);
  const overview = useAsync(() => trainingService.overview(), []);
  const courses = useAsync(() => trainingService.courses({ filter, search: term }), [filter, term]);
  const o = overview.data;
  const list = courses.data?.data || [];

  const launch = async (c) => {
    try {
      const course = c.status === 'not_started' ? await trainingService.start(c.id) : c;
      if (c.status === 'not_started') courses.reload();
      setOpen(course);
    } catch (e) { toast.error(e.message); }
  };
  const refresh = () => { overview.reload(); courses.reload(); };

  return (
    <>
      <PageHeader title="Training & Resources Library" subtitle="Access professional development modules, health protocols, and safety guidelines for your school staff." />

      {overview.loading && !o ? <div className="grid gap-4 md:grid-cols-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-[118px]" />)}</div>
        : overview.error && !o ? <ErrorState error={overview.error} onRetry={overview.reload} />
        : (
          <div className="grid gap-4 md:grid-cols-3">
            <StatTile icon={ShieldCheck} label="Mandatory Courses" value={o.stats.mandatory.completed} suffix={`/ ${o.stats.mandatory.total}`}>
              <div className="h-1.5 rounded-full bg-field"><div className="h-full rounded-full bg-brand-dark" style={{ width: `${(o.stats.mandatory.completed / Math.max(1, o.stats.mandatory.total)) * 100}%` }} /></div>
            </StatTile>
            <StatTile icon={Clock} label="Learning Hours" value={o.stats.learningHours.value} suffix="hrs" sub={`+${o.stats.learningHours.thisWeek} hrs this week`} trend="up" />
            <StatTile icon={Award} label="Certificates" value={o.stats.certificates.count} sub={o.stats.certificates.latest ? `Latest: ${o.stats.certificates.latest}` : 'None yet'} />
          </div>
        )}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="relative min-w-[240px] max-w-md flex-1"><Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" /><Input className="pl-10" placeholder="Search for courses, guides, or topics..." value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search courses" /></div>
        <Chips items={COURSE_FILTERS} value={filter} onChange={setFilter} />
      </div>

      <div className="mt-7 flex items-center justify-between"><h2 className="font-semibold">Core Curriculum</h2>{list.length > 4 && <button onClick={() => setAll((a) => !a)} className="flex items-center gap-1 text-xs font-semibold text-brand hover:underline">{all ? 'Show less' : 'View All'}<ArrowRight className="h-3.5 w-3.5" /></button>}</div>

      <div className="mt-4">
        {courses.loading && !courses.data ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[300px]" />)}</div>
          : courses.error && !courses.data ? <ErrorState error={courses.error} onRetry={courses.reload} />
          : !list.length ? <EmptyState icon={Library} title="No resources found" text="Try a different search or filter." />
          : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {(all ? list : list.slice(0, 4)).map((c) => {
                const Icon = TYPE_ICON[c.type] || BookOpen;
                const cta = c.status === 'completed' ? 'Review Course' : c.status === 'in_progress' ? 'Resume Course' : 'Start Course';
                return (
                  <article key={c.id} className="card flex flex-col overflow-hidden">
                    <div className="relative h-[104px]">
                      <BrandImage src={`/brand/course-${c.id}.jpg`} className="h-full w-full object-cover" fallback={<div className={cx('flex h-full w-full items-center justify-center bg-gradient-to-br text-white/90', TYPE_GRADIENT[c.type])}><Icon className="h-10 w-10" strokeWidth={1.4} /></div>} />
                      {c.mandatory && <span className="absolute left-2 top-2 flex items-center gap-1 rounded bg-white px-2 py-1 text-[10px] font-semibold text-ink shadow-sm"><BadgeCheck className="h-3 w-3 text-brand" />Mandatory</span>}
                    </div>
                    <div className="flex flex-1 flex-col p-4">
                      <p className="flex items-center gap-1.5 text-[11px] text-muted"><Icon className="h-3 w-3" />{COURSE_TYPES[c.type]} <span>•</span> {duration(c.durationMinutes)}</p>
                      <h3 className="mt-1.5 text-[15px] font-semibold">{c.title}</h3>
                      <p className="mt-1 line-clamp-2 text-xs text-muted">{c.description}</p>
                      <div className="mt-auto pt-4"><Button variant={c.status === 'in_progress' ? 'primary' : 'outline'} size="sm" className="w-full" onClick={() => launch(c)}>{cta}</Button></div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
      </div>
      {open && <CourseModal course={open} onClose={() => setOpen(null)} onChanged={refresh} />}
    </>
  );
}
