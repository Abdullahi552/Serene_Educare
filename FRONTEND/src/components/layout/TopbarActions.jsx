import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, CheckCheck, CircleHelp, Mail, Phone } from 'lucide-react';
import { notificationService } from '@/services/healthService';
import { useClickOutside } from '@/hooks/useClickOutside';
import { SUPPORT_EMAIL, SUPPORT_PHONE } from '@/config/env';
import { cx, timeAgo } from '@/lib/format';

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const ref = useRef(null);
  useClickOutside(ref, () => setOpen(false), open);

  const load = useCallback(async () => { try { const r = await notificationService.list(); setItems(r.data || []); } catch { /* non-critical */ } }, []);
  useEffect(() => { load(); const t = setInterval(load, 60000); return () => clearInterval(t); }, [load]);
  const unread = items.filter((n) => !n.read).length;
  const markAll = async () => { try { await notificationService.markAllRead(); setItems((l) => l.map((n) => ({ ...n, read: true }))); } catch { /* ignore */ } };

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`} className="relative flex h-10 w-10 items-center justify-center rounded-full text-brand transition hover:bg-mint-100">
        <Bell className="h-6 w-6" />
        {unread > 0 && <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full border-2 border-white bg-danger" />}
      </button>
      {open && (
        <div className="absolute right-0 top-12 z-40 w-[min(92vw,360px)] animate-pop-in rounded-3xl bg-white p-2 shadow-pop ring-1 ring-line">
          <div className="flex items-center justify-between px-3 py-2">
            <p className="font-semibold">Notifications</p>
            {unread > 0 && <button onClick={markAll} className="flex items-center gap-1 text-xs font-semibold text-brand-dark hover:underline"><CheckCheck className="h-3.5 w-3.5" />Mark all read</button>}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {!items.length && <p className="px-3 py-8 text-center text-sm text-muted">You're all caught up.</p>}
            {items.map((n) => (
              <div key={n.id} className={cx('rounded-2xl px-3 py-2.5', !n.read && 'bg-mint-50')}>
                <p className="text-sm font-semibold">{n.title}</p>
                <p className="text-sm text-muted">{n.message}</p>
                <p className="mt-0.5 text-xs text-muted">{timeAgo(n.createdAt)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function HelpButton() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useClickOutside(ref, () => setOpen(false), open);
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} aria-label="Help" className="flex h-10 w-10 items-center justify-center rounded-full text-brand transition hover:bg-mint-100"><CircleHelp className="h-6 w-6" /></button>
      {open && (
        <div className="absolute right-0 top-12 z-40 w-72 animate-pop-in rounded-3xl bg-white p-4 shadow-pop ring-1 ring-line">
          <p className="font-semibold">Need help?</p>
          <p className="mt-1 text-sm text-muted">Ask SereneAI about protocols, or contact our support team.</p>
          <Link to="/app/ai" onClick={() => setOpen(false)} className="mt-3 block rounded-full bg-brand px-4 py-2 text-center text-sm font-semibold text-white hover:bg-brand-dark">Ask SereneAI</Link>
          <a href={`mailto:${SUPPORT_EMAIL}`} className="mt-3 flex items-center gap-2 text-sm text-brand-dark hover:underline"><Mail className="h-4 w-4" />{SUPPORT_EMAIL}</a>
          {SUPPORT_PHONE && <a href={`tel:${SUPPORT_PHONE.replace(/\s/g, '')}`} className="mt-2 flex items-center gap-2 text-sm text-brand-dark hover:underline"><Phone className="h-4 w-4" />{SUPPORT_PHONE}</a>}
        </div>
      )}
    </div>
  );
}
