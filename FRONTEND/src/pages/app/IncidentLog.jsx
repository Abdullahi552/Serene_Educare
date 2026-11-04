import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardPlus, Plus, Search } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import Avatar from '@/components/common/Avatar';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { Input, Select } from '@/components/ui/Field';
import Pagination from '@/components/ui/Pagination';
import { Badge, EmptyState, ErrorState, Skeleton, Spinner } from '@/components/ui/Feedback';
import { useAsync } from '@/hooks/useAsync';
import { useDebounce } from '@/hooks/useDebounce';
import { useToast } from '@/context/ToastContext';
import { incidentService } from '@/services/healthService';
import { assetUrl } from '@/config/env';
import { FIRST_AID_OPTIONS, INCIDENT_STATUSES, INCIDENT_TYPES } from '@/lib/constants';
import { formatBytes, formatDateTime } from '@/lib/format';

const typeLabel = (v) => INCIDENT_TYPES.find((t) => t.value === v)?.label || v;

function IncidentModal({ id, onClose }) {
  const { data: i, loading, error, reload } = useAsync(() => incidentService.get(id), [id]);
  return (
    <Modal onClose={onClose} title={i ? `Report ${i.reference}` : 'Incident report'} size="md">
      {loading && !i && <div className="flex justify-center py-10"><Spinner /></div>}
      {error && <ErrorState error={error} onRetry={reload} />}
      {i && (
        <div className="space-y-4 text-sm">
          <div className="flex items-center gap-3"><Avatar name={i.student.name} size={40} /><div><p className="font-semibold">{i.student.name}</p><p className="text-xs text-muted">{i.student.className} · #{i.student.admissionNo}</p></div>{i.isDraft && <Badge tone="warn" className="ml-auto">Draft</Badge>}</div>
          <dl className="grid grid-cols-2 gap-3">
            {[['Type', typeLabel(i.type)], ['Location', i.location || '—'], ['When', formatDateTime(i.occurredAt)], ['Reported by', i.reportedBy?.name || '—'], ['Parent notified', i.notifyParent ? 'Yes' : 'No']].map(([k, v]) => <div key={k}><dt className="text-xs text-muted">{k}</dt><dd className="font-medium">{v}</dd></div>)}
          </dl>
          <div><p className="text-xs text-muted">Description</p><p className="mt-0.5 whitespace-pre-wrap">{i.description || '—'}</p></div>
          <div><p className="text-xs text-muted">First aid administered</p><div className="mt-1 flex flex-wrap gap-2">{i.firstAid?.length ? i.firstAid.map((v) => <Badge key={v} tone="mint">{FIRST_AID_OPTIONS.find((o) => o.value === v)?.label || v}</Badge>) : '—'}</div></div>
          {i.attachments?.length > 0 && <div><p className="text-xs text-muted">Attachments</p><ul className="mt-1 space-y-1">{i.attachments.map((a) => <li key={a.id}><a href={assetUrl(a.url)} target="_blank" rel="noreferrer" className="font-medium text-brand hover:underline">{a.name}</a> <span className="text-xs text-muted">{formatBytes(a.sizeBytes)}</span></li>)}</ul></div>}
        </div>
      )}
    </Modal>
  );
}

export default function IncidentLog() {
  const navigate = useNavigate();
  const toast = useToast();
  const [f, setF] = useState({ search: '', type: '', status: '' });
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(null);
  const search = useDebounce(f.search);
  const { data, loading, error, reload } = useAsync(() => incidentService.list({ ...f, search, page, limit: 10 }), [search, f.type, f.status, page]);
  const set = (patch) => { setF({ ...f, ...patch }); setPage(1); };

  const changeStatus = async (inc, status) => {
    try { await incidentService.update(inc.id, { status }); toast.success('Status updated.'); reload(); } catch (e) { toast.error(e.message); }
  };

  return (
    <>
      <PageHeader title="Incident Log" subtitle="Every injury, illness and safety report for your school" actions={<Button size="lg" icon={Plus} onClick={() => navigate('/app/incidents')}>New Report</Button>} />
      <section className="card overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 p-4">
          <div className="relative min-w-[220px] flex-1"><Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" /><Input className="pl-10" placeholder="Search student or report number" value={f.search} onChange={(e) => set({ search: e.target.value })} aria-label="Search incidents" /></div>
          <Select className="w-auto" value={f.type} onChange={(e) => set({ type: e.target.value })} aria-label="Type"><option value="">All types</option>{INCIDENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}</Select>
          <Select className="w-auto" value={f.status} onChange={(e) => set({ status: e.target.value })} aria-label="Status"><option value="">All statuses</option>{INCIDENT_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}</Select>
        </div>
        {loading && !data ? <div className="space-y-2 p-4">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-11" />)}</div>
          : error && !data ? <ErrorState error={error} onRetry={reload} />
          : !data.data.length ? <EmptyState icon={ClipboardPlus} title="No reports found" text="Try different filters, or file a new report." />
          : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px]">
                <thead><tr className="bg-mint-50"><th className="th">Report</th><th className="th">Student</th><th className="th">Type</th><th className="th">Location</th><th className="th">When</th><th className="th">Status</th></tr></thead>
                <tbody>
                  {data.data.map((i) => (
                    <tr key={i.id} className="tr hover:bg-mint-50/50">
                      <td className="td"><button onClick={() => setOpen(i)} className="font-semibold text-brand hover:underline">{i.reference}</button>{i.isDraft && <Badge tone="warn" className="ml-2">Draft</Badge>}</td>
                      <td className="td"><span className="flex items-center gap-2"><Avatar name={i.student.name} size={26} />{i.student.name}<span className="text-xs text-muted">{i.student.className}</span></span></td>
                      <td className="td">{typeLabel(i.type)}</td>
                      <td className="td text-muted">{i.location || '—'}</td>
                      <td className="td text-muted">{formatDateTime(i.occurredAt)}</td>
                      <td className="td">
                        <Select className="h-8 w-36 rounded-lg py-0 text-xs" value={i.status} onChange={(e) => changeStatus(i, e.target.value)} aria-label={`Status of ${i.reference}`}>{INCIDENT_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}</Select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        <Pagination pagination={data?.pagination} onPage={setPage} label="reports" />
      </section>
      {open && <IncidentModal id={open.id} onClose={() => setOpen(null)} />}
    </>
  );
}
