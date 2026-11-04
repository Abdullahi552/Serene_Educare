import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Save } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import Avatar from '@/components/common/Avatar';
import Button from '@/components/ui/Button';
import { Checkbox, Field, Input, Switch } from '@/components/ui/Field';
import Tabs from '@/components/ui/Tabs';
import Pagination from '@/components/ui/Pagination';
import { Badge, ErrorState, Skeleton } from '@/components/ui/Feedback';
import { useAsync } from '@/hooks/useAsync';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { schoolService } from '@/services/healthService';
import { assetUrl } from '@/config/env';
import { ROLE_LABELS } from '@/lib/constants';
import { cx, initials, timeAgo } from '@/lib/format';

const TABS = [{ value: 'general', label: 'General Info' }, { value: 'contact', label: 'Contact Details' }, { value: 'notifications', label: 'Notifications' }, { value: 'roles', label: 'User Roles' }];
const pick = (s) => ({
  name: s.name || '', schoolCode: s.schoolCode || '', physicalAddress: s.physicalAddress || '', mailingAddress: s.mailingAddress || '', mailingSameAsPhysical: !!s.mailingSameAsPhysical,
  contact: { name: '', jobTitle: '', healthOfficePhone: '', emergencyEmail: '', ...(s.contact || {}) },
  notifications: { dailyReport: { enabled: false, time: '08:00' }, emergencySms: { enabled: false }, weeklyDigest: { enabled: false }, ...(s.notifications || {}) },
});
const ROLE_TONE = { school_admin: 'ok', principal: 'ok', school_nurse: 'ok', counselor: 'warn', teacher: 'neutral' };

function Roles() {
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useAsync(() => schoolService.users({ page, limit: 6 }), [page]);
  return (
    <>
      <div className="mb-4 flex items-center justify-between"><h2 className="font-semibold">User Roles & Access</h2><Badge tone="ok">View Only</Badge></div>
      <div className="card overflow-hidden">
        {loading && !data ? <div className="space-y-2 p-4">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div> : error && !data ? <ErrorState error={error} onRetry={reload} /> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead><tr className="bg-mint-50"><th className="th">User</th><th className="th">Role</th><th className="th">Status</th><th className="th text-right">Last Active</th></tr></thead>
              <tbody>
                {data.data.map((u) => (
                  <tr key={u.id} className="tr">
                    <td className="td"><span className="flex items-center gap-3"><Avatar name={u.name} size={32} /><span><span className="block font-medium">{u.name}</span><span className="block text-xs text-brand">{u.email}</span></span></span></td>
                    <td className="td"><Badge tone={ROLE_TONE[u.role]}>{ROLE_LABELS[u.role] || u.role}</Badge></td>
                    <td className="td"><span className="flex items-center gap-2 text-xs"><span className={cx('h-2 w-2 rounded-full', u.status === 'active' ? 'bg-brand' : 'bg-[#9CA3AF]')} />{u.status === 'active' ? 'Active' : 'Offline'}</span></td>
                    <td className="td text-right text-xs text-muted">{timeAgo(u.lastActiveAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination pagination={data?.pagination} onPage={setPage} label="users" />
      </div>
    </>
  );
}

export default function SchoolProfile() {
  const toast = useToast();
  const { patchSchool } = useAuth();
  const [params, setParams] = useSearchParams();
  const tab = TABS.some((t) => t.value === params.get('tab')) ? params.get('tab') : 'general';
  const logoRef = useRef(null);
  const { data, loading, error, reload } = useAsync(() => schoolService.get(), []);
  const [form, setForm] = useState(null);
  const [saved, setSaved] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [logoBusy, setLogoBusy] = useState(false);

  useEffect(() => { if (data) { setForm(pick(data)); setSaved(pick(data)); } }, [data]);

  if (loading && !data) return <><PageHeader title="School Profile" subtitle="Manage your school's information, contacts, and preferences." /><Skeleton className="h-96" /></>;
  if (error && !data) return <ErrorState error={error} onRetry={reload} />;
  if (!form) return null;

  const dirty = JSON.stringify(form) !== JSON.stringify(saved);
  const set = (patch) => setForm((p) => ({ ...p, ...patch }));
  const setIn = (group, patch) => setForm((p) => ({ ...p, [group]: { ...p[group], ...patch } }));

  const save = async () => {
    const er = {};
    if (!form.name.trim()) er.name = 'Enter the school name.';
    if (form.contact.emergencyEmail && !/^\S+@\S+\.\S+$/.test(form.contact.emergencyEmail)) er['contact.emergencyEmail'] = 'Enter a valid email.';
    setErrors(er);
    if (Object.keys(er).length) return;
    setSaving(true);
    try {
      const body = { ...form, mailingAddress: form.mailingSameAsPhysical ? form.physicalAddress : form.mailingAddress };
      const res = await schoolService.update(body);
      patchSchool({ name: res.name });
      setSaved(pick(res)); setForm(pick(res));
      toast.success('School profile saved.');
    } catch (e) { if (e.errors) setErrors(e.errors); else toast.error(e.message); } finally { setSaving(false); }
  };

  const onLogo = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!/^image\/(png|jpe?g|svg\+xml)$/.test(file.type)) return toast.error('Use a PNG, JPG or SVG image.');
    if (file.size > 2 * 1024 * 1024) return toast.error('Logo must be 2 MB or smaller.');
    setLogoBusy(true);
    try { const { logoUrl } = await schoolService.uploadLogo(file); patchSchool({ logoUrl }); reload(); toast.success('Logo updated.'); } catch (err) { toast.error(err.message); } finally { setLogoBusy(false); }
  };
  const removeLogo = async () => {
    setLogoBusy(true);
    try { await schoolService.removeLogo(); patchSchool({ logoUrl: null }); reload(); toast.success('Logo removed.'); } catch (err) { toast.error(err.message); } finally { setLogoBusy(false); }
  };

  const logo = assetUrl(data.logoUrl);
  const N = form.notifications;

  return (
    <>
      <PageHeader
        title="School Profile" subtitle="Manage your school's information, contacts, and preferences."
        actions={tab !== 'roles' && (<><Button variant="soft" size="lg" disabled={!dirty || saving} onClick={() => { setForm(saved); setErrors({}); }}>Cancel</Button><Button size="lg" icon={Save} loading={saving} disabled={!dirty} onClick={save}>Save Changes</Button></>)}
      />
      <Tabs tabs={TABS} value={tab} onChange={(v) => setParams({ tab: v })} />

      <div className="mt-6">
        {tab === 'general' && (
          <>
            <h2 className="mb-4 font-semibold">General Information</h2>
            <div className="card space-y-6 p-5 sm:p-6">
              <div className="flex flex-wrap items-center gap-5 rounded-xl border border-dashed border-line bg-mint-50/50 p-5">
                {logo ? <img src={logo} alt="School logo" className="h-16 w-16 rounded-lg object-contain" /> : <span className="flex h-16 w-16 items-center justify-center rounded-lg bg-[#E53935] text-2xl font-semibold text-white">{initials(form.name)}</span>}
                <div><p className="font-semibold">School Logo</p><p className="mt-1 text-xs text-muted">Upload your school's official logo. Supported formats: PNG, JPG, SVG.</p>
                  <div className="mt-3 flex items-center gap-4"><input ref={logoRef} type="file" accept="image/png,image/jpeg,image/svg+xml" className="sr-only" onChange={onLogo} aria-label="Upload logo" /><Button variant="outline" size="sm" loading={logoBusy} onClick={() => logoRef.current?.click()}>Upload New</Button>{data.logoUrl && <button onClick={removeLogo} disabled={logoBusy} className="text-xs font-medium text-danger hover:underline">Remove</button>}</div></div>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="School Name" error={errors.name}><Input value={form.name} onChange={(e) => set({ name: e.target.value })} invalid={!!errors.name} /></Field>
                <Field label="School ID"><Input value={form.schoolCode} onChange={(e) => set({ schoolCode: e.target.value })} /></Field>
              </div>
              <Field label="Physical Address"><Input value={form.physicalAddress} onChange={(e) => set({ physicalAddress: e.target.value })} /></Field>
              <div>
                <label className="label mb-1">Mailing Address</label>
                <Checkbox className="mb-2" checked={form.mailingSameAsPhysical} onChange={(v) => set({ mailingSameAsPhysical: v })} label="Same as physical address" />
                <Input value={form.mailingSameAsPhysical ? form.physicalAddress : form.mailingAddress} disabled={form.mailingSameAsPhysical} onChange={(e) => set({ mailingAddress: e.target.value })} placeholder="Enter mailing address if different" aria-label="Mailing address" />
              </div>
            </div>
          </>
        )}

        {tab === 'contact' && (
          <>
            <h2 className="mb-4 font-semibold">Contact Details</h2>
            <div className="card grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
              <Field label="Primary Contact Name"><Input value={form.contact.name} onChange={(e) => setIn('contact', { name: e.target.value })} /></Field>
              <Field label="Job Title"><Input value={form.contact.jobTitle} onChange={(e) => setIn('contact', { jobTitle: e.target.value })} /></Field>
              <Field label="Health Office Phone"><Input type="tel" value={form.contact.healthOfficePhone} onChange={(e) => setIn('contact', { healthOfficePhone: e.target.value })} /></Field>
              <Field label="Emergency Email" error={errors['contact.emergencyEmail']}><Input type="email" value={form.contact.emergencyEmail} onChange={(e) => setIn('contact', { emergencyEmail: e.target.value })} invalid={!!errors['contact.emergencyEmail']} /></Field>
            </div>
          </>
        )}

        {tab === 'notifications' && (
          <>
            <h2 className="mb-4 font-semibold">Notification Preferences</h2>
            <div className="card divide-y divide-line">
              <div className="flex flex-wrap items-center justify-between gap-4 p-5"><div><p className="font-semibold">Daily Health Reports</p><p className="text-xs text-muted">Receive a summary of clinic visits and incidents every day.</p></div>
                <div className="flex items-center gap-4"><Input type="time" className="w-32" value={N.dailyReport.time} disabled={!N.dailyReport.enabled} onChange={(e) => setIn('notifications', { dailyReport: { ...N.dailyReport, time: e.target.value } })} aria-label="Daily report time" /><Switch checked={N.dailyReport.enabled} onChange={(v) => setIn('notifications', { dailyReport: { ...N.dailyReport, enabled: v } })} label="Daily health reports" /></div></div>
              <div className="flex items-center justify-between gap-4 p-5"><div><p className="font-semibold">Emergency Alerts</p><p className="text-xs text-muted">Instant SMS and email for serious incidents, such as an injury needing referral.</p></div><Switch checked={N.emergencySms.enabled} onChange={(v) => setIn('notifications', { emergencySms: { enabled: v } })} label="Emergency alerts" /></div>
              <div className="flex items-center justify-between gap-4 p-5"><div><p className="font-semibold">Weekly Analytics Digest</p><p className="text-xs text-muted">A weekly email of health trends and compliance scores.</p></div><Switch checked={N.weeklyDigest.enabled} onChange={(v) => setIn('notifications', { weeklyDigest: { enabled: v } })} label="Weekly analytics digest" /></div>
            </div>
          </>
        )}

        {tab === 'roles' && <Roles />}
      </div>
    </>
  );
}
