import { Link } from 'react-router-dom';
import { Activity, BriefcaseMedical, ChartColumn, Check, CheckCircle2 } from 'lucide-react';
import { BrandImage, BrandLogo } from '@/components/brand/Brand';
import Button from '@/components/ui/Button';
import { ONE_OFF_SERVICES, PLANS } from '@/lib/constants';
import { cx, formatNaira } from '@/lib/format';

const RINGS = [
  { w: '170%', c: '#F0FFF2' }, { w: '140%', c: '#E2FCE7' }, { w: '112%', c: '#D2F8DA' },
  { w: '86%', c: '#BDF2CA' }, { w: '62%', c: '#9CEBB2' }, { w: '38%', c: '#6FDC8E' }, { w: '22%', c: '#27AB4D' },
];

function Hero() {
  return (
    <section className="relative overflow-hidden rounded-[36px] bg-white shadow-shell sm:rounded-[56px]">
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-full" aria-hidden>
        {RINGS.map((r) => <span key={r.w} className="absolute bottom-0 left-1/2 aspect-square -translate-x-1/2 translate-y-1/2 rounded-full" style={{ width: r.w, background: r.c }} />)}
      </div>
      <div className="relative z-10 mx-auto flex min-h-[560px] max-w-4xl flex-col items-center px-5 pt-12 text-center sm:min-h-[640px] sm:pt-16">
        <h1 className="text-[clamp(34px,5vw,64px)] font-semibold leading-[1.1] text-brand-dark">A smarter way to<br />manage student health</h1>
        <p className="mt-5 max-w-xl text-[clamp(15px,1.4vw,20px)] text-ink/90">Run a structured, data-driven school health system. Track, monitor, and respond to student health needs with clarity and confidence.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <a href="#about"><Button size="xl" className="min-w-[200px] bg-brand">See how it works</Button></a>
          <Link to="/login"><Button size="xl" variant="white" className="min-w-[200px] bg-white/60 text-brand-dark shadow-soft backdrop-blur">Sign in</Button></Link>
        </div>
        <div className="relative mt-auto flex w-full items-end justify-center pt-10">
          <BrandImage
            src="/brand/hero-students.png" alt="Students" className="relative z-10 h-auto max-h-[330px] w-auto max-w-full object-contain"
            fallback={(
              <div className="mb-10 flex flex-wrap items-center justify-center gap-4">
                {[[BriefcaseMedical, 'Respond'], [Activity, 'Monitor'], [ChartColumn, 'Track']].map(([Icon, label]) => (
                  <div key={label} className="flex items-center gap-3 rounded-3xl bg-white px-6 py-4 shadow-shell"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-danger-bg text-danger"><Icon className="h-6 w-6" /></span><span className="text-lg font-semibold text-brand-dark">{label}</span></div>
                ))}
              </div>
            )}
          />
        </div>
      </div>
    </section>
  );
}

const List = ({ items }) => (
  <ul className="mt-4 space-y-3">
    {items.map((t) => <li key={t} className="flex items-start gap-3 text-[17px]"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand" />{t}</li>)}
  </ul>
);

function About() {
  return (
    <section id="about" className="scroll-mt-6 rounded-[36px] bg-white p-6 shadow-shell sm:rounded-[56px] sm:p-12">
      <h2 className="text-center text-[clamp(26px,3vw,40px)] font-semibold text-brand-dark">Back-to-School Health Program</h2>
      <p className="mx-auto mt-4 max-w-3xl text-center text-[clamp(15px,1.4vw,19px)] text-slate">Serene Eduhealth partners with schools to provide structured, preventive and responsive health systems that improve student wellbeing, attendance and academic performance.</p>
      <div className="mt-10 grid gap-5 md:grid-cols-2">
        <div className="rounded-[28px] bg-mint-50 p-7"><h3 className="text-2xl font-semibold text-brand">What We Offer</h3><List items={['School Health Program Setup', 'Termly Health Education Sessions', 'Access to Health Support (Students & Staff)', 'Preventive Health Guidance & Monitoring']} /></div>
        <div className="rounded-[28px] bg-mint-50 p-7"><h3 className="text-2xl font-semibold text-brand">Why It Matters</h3><List items={['Healthier students learn better', 'Reduced absenteeism', 'Improved school reputation with parents', 'Proactive health management (not reactive)']} /></div>
      </div>
      <div className="mt-5 grid gap-5 md:grid-cols-[1.4fr_1fr]">
        <div className="rounded-[28px] bg-gradient-to-br from-brand to-brand-deep p-7 text-white">
          <h3 className="text-2xl font-semibold">Special Offer (Limited Onboarding)</h3>
          <p className="mt-3 text-white/90">We are currently onboarding a select number of schools before resumption for our Founding Schools Batch.</p>
          <p className="mt-5 text-sm font-semibold uppercase tracking-wide text-white/80">Benefits</p>
          <ul className="mt-2 space-y-2">{['20% Discounted entry package', 'Priority support', 'Early implementation advantage'].map((b) => <li key={b} className="flex items-center gap-2"><Check className="h-4 w-4" />{b}</li>)}</ul>
        </div>
        <div className="flex flex-col justify-between rounded-[28px] border border-line bg-white p-7">
          <div><h3 className="text-2xl font-semibold text-brand">Next Step</h3><p className="mt-3 text-slate">Confirm your school’s participation to begin onboarding immediately.</p></div>
          <Link to="/signup" className="mt-6"><Button variant="dark" size="xl" className="w-full">Get on board</Button></Link>
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  return (
    <section id="resources" className="scroll-mt-6 rounded-[36px] bg-white p-6 shadow-shell sm:rounded-[56px] sm:p-12">
      <h2 className="text-center text-[clamp(26px,3vw,40px)] font-semibold text-brand-dark">School Health Subscription Plans</h2>
      <p className="mx-auto mt-3 w-fit rounded-full bg-mint-50 px-8 py-2 text-lg font-semibold">Per Term</p>
      <div className="mt-10 grid items-stretch gap-5 lg:grid-cols-3">
        {PLANS.map((p) => (
          <div key={p.key} className={cx('relative flex flex-col rounded-[28px] border p-7 pt-10', p.featured ? 'border-brand-dark bg-brand-dark text-white lg:-my-4 lg:py-14' : 'border-brand/50 bg-white')}>
            <span className={cx('absolute left-1/2 top-0 -translate-x-1/2 rounded-b-2xl px-8 py-2 text-sm font-semibold', p.featured ? 'bg-brand-deep text-white' : 'bg-brand text-white')}>{p.name}</span>
            <p className="text-center text-4xl font-bold">{formatNaira(p.price)}</p>
            <p className={cx('mt-2 text-center text-sm', p.featured ? 'text-white/80' : 'text-muted')}>{p.ideal}</p>
            {p.includes && <p className={cx('mt-5 text-center text-sm', p.featured ? 'text-white' : 'text-slate')}>{p.includes}</p>}
            <ul className="mt-5 space-y-2.5">{p.features.map((f) => <li key={f} className="flex items-start gap-2.5 text-[15px]"><Check className={cx('mt-0.5 h-4 w-4 shrink-0', p.featured ? 'text-white' : 'text-brand')} />{f}</li>)}</ul>
            <Link to={`/signup?plan=${p.key}`} className="mt-auto pt-7"><Button variant={p.featured ? 'white' : 'primary'} size="lg" className="w-full">Choose {p.name.split(' ')[0]}</Button></Link>
          </div>
        ))}
      </div>
      <div className="mt-8 grid items-center gap-5 rounded-[28px] bg-brand p-6 text-white md:grid-cols-[240px_1fr] md:p-8">
        <p className="rounded-2xl bg-[#222] px-6 py-6 text-center text-lg font-semibold leading-snug">One-Off Services<br /><span className="text-sm font-normal text-white/75">(Non-Subscribers)</span></p>
        <ul className="space-y-2">{ONE_OFF_SERVICES.map(([n, price]) => <li key={n} className="flex flex-wrap items-center gap-x-2"><Check className="h-4 w-4" />{n}: <b>{price}</b></li>)}</ul>
      </div>
    </section>
  );
}

export default function Landing() {
  return (
    <div className="space-y-6">
      <Hero />
      <About />
      <Pricing />
      <footer className="flex flex-wrap items-center justify-between gap-4 rounded-full bg-white px-8 py-5 shadow-nav">
        <BrandLogo className="h-10" />
        <p className="text-sm text-muted">© {new Date().getFullYear()} Serene EduHealth Services Ltd. All rights reserved.</p>
      </footer>
    </div>
  );
}
