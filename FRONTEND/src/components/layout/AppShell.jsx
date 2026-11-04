import { Suspense, useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { BarChart3, Bot, ClipboardPlus, FileBarChart, GraduationCap, LayoutDashboard, LogOut, Menu, Settings, X } from 'lucide-react';
import { BrandImage, BrandLogo } from '@/components/brand/Brand';
import { Spinner } from '@/components/ui/Feedback';
import GlobalSearch from '@/components/layout/GlobalSearch';
import { HelpButton, NotificationBell } from '@/components/layout/TopbarActions';
import { useAuth } from '@/context/AuthContext';
import { useClickOutside } from '@/hooks/useClickOutside';
import { assetUrl } from '@/config/env';
import { cx } from '@/lib/format';

const NAV = [
  { to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/app/activities', label: 'Health Activity Tracker', icon: BarChart3 },
  { to: '/app/incidents', label: 'Injury/ Incident Reporting', icon: ClipboardPlus },
  { to: '/app/reports', label: 'Reports & Insights', icon: FileBarChart },
  { to: '/app/training', label: 'Training & Resources Library', icon: GraduationCap },
];

function SideLink({ to, end, icon: Icon, children, onClick }) {
  return (
    <NavLink
      to={to} end={end} onClick={onClick}
      className={({ isActive }) => cx('flex items-center gap-4 rounded-full px-5 py-3.5 text-[15px] font-medium text-white transition xl:text-[16.5px]', isActive ? 'bg-brand-dark' : 'hover:bg-white/10')}
    >
      {Icon ? <Icon className="h-[22px] w-[22px] shrink-0" /> : null}
      <span className="leading-tight">{children}</span>
    </NavLink>
  );
}

export default function AppShell() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [drawer, setDrawer] = useState(false);
  const [acct, setAcct] = useState(false);
  const acctRef = useRef(null);
  const mainRef = useRef(null);
  useClickOutside(acctRef, () => setAcct(false), acct);

  // Close the mobile drawer and scroll to top on navigation.
  useEffect(() => { setDrawer(false); mainRef.current?.scrollTo?.({ top: 0 }); }, [location.pathname]);

  const school = user.school;
  const logo = assetUrl(school.logoUrl);
  const isChat = location.pathname.startsWith('/app/ai');

  const sidebar = (
    <div className="flex h-full flex-col rounded-[40px] bg-brand pb-5 text-white shadow-shell xl:rounded-[70px]">
      <div className="mx-4 mt-4 flex h-[88px] items-center justify-center rounded-full bg-white xl:h-[104px]"><BrandLogo className="h-14 xl:h-16" /></div>

      <nav className="mt-6 flex-1 space-y-1 overflow-y-auto px-5 xl:px-6" aria-label="Main">
        {NAV.map((n) => <SideLink key={n.to} {...n}>{n.label}</SideLink>)}
        <hr className="!my-5 border-white/30" />
        <p className="px-5 text-[13px] font-semibold uppercase tracking-[0.05em]">Settings</p>
        <SideLink to="/app/profile" icon={Settings}>School Profile</SideLink>
        <hr className="!my-5 border-white/30" />
        <NavLink to="/app/ai" className={({ isActive }) => cx('flex items-center gap-3 rounded-full py-2.5 pl-3 pr-5 text-[15px] font-medium transition xl:text-[16.5px]', isActive ? 'bg-brand-dark' : 'hover:bg-white/10')}>
          <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white text-brand">
            <BrandImage src="/brand/serene-ai.png" className="h-full w-full object-cover" fallback={<Bot className="h-6 w-6" />} />
          </span>
          Serene AI
        </NavLink>
      </nav>

      <div className="relative mx-5 mt-3 border-t border-white/30 pt-4" ref={acctRef}>
        <button onClick={() => setAcct((a) => !a)} className="flex w-full items-center gap-3 rounded-full text-left" aria-haspopup="menu" aria-expanded={acct}>
          {logo ? <img src={logo} alt="" className="h-12 w-12 shrink-0 rounded-full bg-white object-contain" /> : <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#E53935] text-2xl font-medium">{school.name?.[0] || 'S'}</span>}
          <span className="min-w-0"><span className="block truncate text-lg font-bold leading-tight xl:text-[21px]">{school.name}</span><span className="block truncate text-sm opacity-90">{user.title || 'School Health Manager'}</span></span>
        </button>
        {acct && (
          <div role="menu" className="absolute bottom-[72px] left-0 right-0 animate-pop-in rounded-2xl bg-white p-2 text-ink shadow-pop">
            <p className="truncate px-3 py-1.5 text-xs text-muted">{user.name} · {user.email}</p>
            <button role="menuitem" onClick={logout} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-danger-ink hover:bg-danger-soft"><LogOut className="h-4 w-4" />Sign out</button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="bg-page h-screen overflow-hidden p-2 sm:p-3 lg:py-[2.4vh] lg:pl-[3.2vw] lg:pr-[2.2vw]">
      {/* Mobile drawer */}
      {drawer && <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setDrawer(false)} />}
      {drawer && <div className="fixed inset-y-2 left-2 z-50 w-[300px] max-w-[88vw] animate-pop-in lg:hidden">{sidebar}</div>}

      <div className="flex h-full">
        <aside className="relative z-20 hidden h-full w-[300px] shrink-0 lg:block xl:w-[347px]">{sidebar}</aside>

        <div ref={mainRef} className="relative h-full min-w-0 flex-1 overflow-y-auto rounded-[28px] bg-white shadow-shell lg:-ml-14 lg:rounded-[48px] lg:pl-14 xl:rounded-[70px]">
          <div className="sticky top-0 z-10 flex items-center gap-3 bg-white/95 px-4 pb-3 pt-4 backdrop-blur sm:px-8 lg:px-10 lg:pt-6 xl:pr-14">
            <button onClick={() => setDrawer(true)} aria-label="Open menu" className="flex h-10 w-10 items-center justify-center rounded-full bg-mint-100 text-brand lg:hidden"><Menu className="h-5 w-5" /></button>
            <GlobalSearch />
            <div className="ml-auto flex items-center gap-1"><NotificationBell /><HelpButton /></div>
          </div>
          <div className="mx-4 border-t-2 border-line/80 sm:mx-8 lg:mx-10 xl:mr-14" />
          <main className={cx('px-4 pb-10 pt-6 sm:px-8 lg:px-10 xl:pr-14', isChat && 'pb-6')}>
            <Suspense fallback={<div className="flex justify-center py-24"><Spinner className="h-7 w-7" /></div>}><Outlet /></Suspense>
          </main>
        </div>
      </div>
      {drawer && <button className="fixed right-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-white text-brand shadow lg:hidden" onClick={() => setDrawer(false)} aria-label="Close menu"><X className="h-5 w-5" /></button>}
    </div>
  );
}
