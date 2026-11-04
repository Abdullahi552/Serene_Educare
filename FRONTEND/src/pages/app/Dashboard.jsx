import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, Bot, CalendarDays, ClipboardList, Eye, FilePlus2, HeartPulse, Pill, Thermometer, TrendingUp, Cross } from 'lucide-react';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { Badge, EmptyState, ErrorState, Skeleton } from '@/components/ui/Feedback';
import { WeeklyBars } from '@/components/charts/Charts';
import { useAuth } from '@/context/AuthContext';
import { useAsync } from '@/hooks/useAsync';
import { dashboardService, trainingService } from '@/services/healthService';
import { INCIDENT_STATUSES } from '@/lib/constants';
import { cx, formatDate, formatTime } from '@/lib/format';

const TYPE_ICON = { injury: [AlertCircle, 'bg-danger-bg text-danger'], illness: [Thermometer, 'bg-warn-bg text-warn-ink'], safety: [AlertCircle, 'bg-warn-bg text-warn-ink'], medication: [Cross, 'bg-ok-bg text-brand'] };
const statusInfo = (s) => INCIDENT_STATUSES.find((x) => x.value === s) || { label: s, tone: 'neutral' };

function StatCard({ label, value, chip, icon: Icon }) {
  return (
    <div className="relative overflow-hidden rounded-[18px] border border-mint-200 bg-mint-50 p-5">
      <span className="absolute -right-8 -top-10 flex h-[118px] w-[118px] items-end justify-start rounded-full bg-[#C9FAD0] pb-6 pl-7"><Icon className="h-9 w-9 text-brand-dark" strokeWidth={1.6} /></span>
      <p className="text-sm text-muted">{label}</p>
      <div className="mt-2 flex items-center gap-3">
        <span className="text-[38px] font-semibold leading-none">{value}</span>
        {chip}
      </div>
    </div>
  );
}
const Chip = ({ children, up }) => <span className="inline-flex items-center gap-1 rounded-full border border-mint-200 bg-white px-3 py-1 text-xs font-semibold text-brand">{up && <TrendingUp className="h-3.5 w-3.5" />}{children}</span>;

function CalendarModal({ onClose }) {
  const { data, loading, error, reload } = useAsync(() => trainingService.events(), []);
  return (
    <Modal onClose={onClose} title="Training calendar" description="Upcoming sessions for your school" size="sm">
      {loading && !data ? <Skeleton className="h-40" /> : error ? <ErrorState error={error} onRetry={reload} /> : !data.data.length ? <EmptyState icon={CalendarDays} title="Nothing scheduled" /> : (
        <ul className="space-y-3">{data.data.map((e) => <li key={e.id} className="flex items-center gap-3"><DateBlock iso={e.startsAt} /><div><p className="text-sm font-semibold">{e.title}</p><p className="text-xs text-muted">{formatTime(e.startsAt)} · {e.location}</p></div></li>)}</ul>
      )}
    </Modal>
  );
}
const DateBlock = ({ iso }) => (
  <span className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg bg-[#D9F8DD] text-brand-dark">
    <span className="text-[10px] font-medium leading-none">{formatDate(iso, { month: 'short' })}</span><span className="text-lg font-bold leading-tight">{new Date(iso).getDate()}</span>
  </span>
);

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data, loading, error, reload } = useAsync(() => dashboardService.get(), []);
  const [calendar, setCalendar] = useState(false);
  const today = new Date();

  const head = (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-[clamp(28px,2.7vw,45px)] font-semibold leading-tight text-brand">Welcome Back!</h1>
        <p className="mt-1 text-[clamp(14px,1.15vw,19px)] text-slate/90">Here is today’s health overview for {user.school.name}</p>
      </div>
      <div className="text-right"><p className="text-sm text-muted">{formatDate(today, { weekday: 'long' })}</p><p className="text-[clamp(18px,1.7vw,24px)] font-semibold">{formatDate(today, { month: 'long', day: 'numeric', year: 'numeric' })}</p></div>
    </div>
  );

  if (loading && !data) return <>{head}<div className="grid gap-5 lg:grid-cols-3"><Skeleton className="h-32" /><Skeleton className="h-32" /><Skeleton className="h-32" /><Skeleton className="h-72 lg:col-span-2" /><Skeleton className="h-72" /></div></>;
  if (error && !data) return <>{head}<ErrorState error={error} onRetry={reload} /></>;

  const { stats, recentIncidents, weeklyActivity, upcomingTrainings } = data;
  const up = (n) => (n == null ? null : <Chip up>{Math.abs(n)}%</Chip>);

  return (
    <>
      {head}
      <section className="grid gap-4 md:grid-cols-3">
        <StatCard label="Clinic Visits Today" value={stats.clinicVisitsToday.value} chip={up(stats.clinicVisitsToday.changePercent)} icon={HeartPulse} />
        <StatCard label="Open Cases" value={stats.openCases.value} chip={<Chip>requiring follow up</Chip>} icon={ClipboardList} />
        <StatCard label="Medication Dispensed" value={stats.medicationDispensed.value} chip={up(stats.medicationDispensed.changePercent)} icon={Pill} />
      </section>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.9fr_1fr]">
        <div className="space-y-5">
          <section className="card">
            <div className="flex items-center justify-between border-b border-line px-5 py-4"><h2 className="font-semibold">Recent Incidents</h2><Link to="/app/incidents/log" className="text-xs font-semibold text-brand hover:underline">View All</Link></div>
            {!recentIncidents.length ? <EmptyState icon={HeartPulse} title="No incidents yet" text="Reported incidents will show here." /> : (
              <ul className="divide-y divide-line">
                {recentIncidents.map((i) => {
                  const [Icon, tone] = TYPE_ICON[i.type] || TYPE_ICON.injury;
                  const st = statusInfo(i.status);
                  return (
                    <li key={i.id} className="flex items-center gap-4 px-5 py-3.5">
                      <span className={cx('flex h-9 w-9 shrink-0 items-center justify-center rounded-full', tone)}><Icon className="h-4 w-4" /></span>
                      <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{i.studentName}</p><p className="truncate text-xs text-muted">{i.summary} • {i.className}</p></div>
                      <div className="flex flex-col items-end gap-1"><Badge tone={st.tone}>{st.label}</Badge><span className="text-[10px] text-muted">{formatTime(i.occurredAt)}</span></div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="card p-5">
            <div className="mb-4 flex items-center justify-between"><h2 className="font-semibold">Health Activity Summary</h2><span className="rounded-lg bg-[#E4FBE7] px-3 py-1.5 text-xs font-medium text-brand-dark">Last 7 Days</span></div>
            <WeeklyBars data={weeklyActivity} />
          </section>
        </div>

        <div className="space-y-5">
          <section className="card p-5">
            <h2 className="mb-4 font-semibold">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                ['Report Injury', AlertCircle, '/app/incidents', 'bg-danger-bg text-danger-ink'],
                ['Record Activity', FilePlus2, '/app/activities?new=1', 'bg-[#E4FBE7] text-brand-dark'],
                ['View Reports', Eye, '/app/reports', 'bg-[#E4FBE7] text-brand-dark'],
                ['AI Assistant', Bot, '/app/ai', 'bg-[#E4FBE7] text-brand-dark'],
              ].map(([label, Icon, to, tone]) => (
                <button key={label} onClick={() => navigate(to)} className={cx('flex h-[78px] flex-col items-center justify-center gap-2 rounded-lg text-[11px] font-medium transition hover:brightness-95', tone)}><Icon className="h-5 w-5" />{label}</button>
              ))}
            </div>
          </section>

          <section className="relative overflow-hidden rounded-[14px] bg-gradient-to-br from-brand-light to-brand-deep p-5 text-white">
            <h2 className="flex items-center gap-2 text-sm font-semibold"><Bot className="h-4 w-4" />SereneAI School Health Chatbot</h2>
            <p className="mt-2 max-w-[220px] text-xs text-white/85">Need help with protocol guidelines or symptom checking?</p>
            <Button variant="white" size="sm" className="mt-4 w-full text-xs" onClick={() => navigate('/app/ai')}>Ask Question</Button>
          </section>

          <section className="card p-5">
            <h2 className="mb-3 font-semibold">Upcoming Trainings</h2>
            {!upcomingTrainings.length ? <p className="py-4 text-center text-sm text-muted">Nothing scheduled.</p> : (
              <ul className="space-y-3 border-t border-line pt-3">{upcomingTrainings.map((t) => <li key={t.id} className="flex items-center gap-3"><DateBlock iso={t.startsAt} /><div className="min-w-0"><p className="truncate text-xs font-semibold">{t.title}</p><p className="truncate text-[11px] text-muted">{formatTime(t.startsAt)} - {t.location}</p></div></li>)}</ul>
            )}
            <button onClick={() => setCalendar(true)} className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-mint-50 py-2 text-xs font-semibold text-brand-dark hover:bg-mint-150"><CalendarDays className="h-4 w-4" />View Calendar</button>
          </section>
        </div>
      </div>
      {calendar && <CalendarModal onClose={() => setCalendar(false)} />}
    </>
  );
}
