import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ImagePlus, Search, Send, ShieldAlert, Stethoscope, Thermometer, X } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import Avatar from '@/components/common/Avatar';
import Button from '@/components/ui/Button';
import { Field, Input, Select, Switch, Textarea } from '@/components/ui/Field';
import { useDebounce } from '@/hooks/useDebounce';
import { useToast } from '@/context/ToastContext';
import { incidentService, studentService } from '@/services/healthService';
import { FIRST_AID_OPTIONS, INCIDENT_LOCATIONS, INCIDENT_TYPES } from '@/lib/constants';
import { cx, formatBytes, toDateTimeInput } from '@/lib/format';

const TYPE_ICON = { injury: Stethoscope, illness: Thermometer, safety: ShieldAlert };
const MAX_FILES = 5;
const MAX_BYTES = 10 * 1024 * 1024;

function StudentPicker({ onPick }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const term = useDebounce(q.trim(), 300);
  useEffect(() => {
    if (term.length < 2) { setResults([]); return undefined; }
    let live = true;
    studentService.list({ search: term, limit: 6 }).then((r) => live && setResults(r.data)).catch(() => live && setResults([]));
    return () => { live = false; };
  }, [term]);
  return (
    <div className="relative max-w-md">
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
      <Input className="pl-10" placeholder="Search student by name or ID to begin" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Find student" autoFocus />
      {term.length >= 2 && (
        <div className="absolute left-0 right-0 top-12 z-20 rounded-2xl bg-white p-2 shadow-pop ring-1 ring-line">
          {!results.length && <p className="px-3 py-3 text-sm text-muted">No students match.</p>}
          {results.map((s) => (
            <button key={s.id} onClick={() => onPick(s)} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left hover:bg-mint-50">
              <Avatar name={s.name} size={30} /><span className="flex-1"><span className="block text-sm font-semibold">{s.name}</span><span className="block text-xs text-muted">{s.className} · #{s.admissionNo}</span></span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function IncidentReport() {
  const navigate = useNavigate();
  const toast = useToast();
  const [params] = useSearchParams();
  const fileRef = useRef(null);
  const [student, setStudent] = useState(null);
  const [f, setF] = useState({ type: 'injury', location: '', occurredAt: toDateTimeInput(), description: '', firstAid: [], notifyParent: false });
  const [files, setFiles] = useState([]);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState('');
  const [drag, setDrag] = useState(false);

  useEffect(() => {
    const id = params.get('student');
    if (id) studentService.get(id).then(setStudent).catch(() => toast.error('Could not find that student.'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const addFiles = (list) => {
    const next = [...files];
    for (const file of Array.from(list)) {
      if (!/^image\/(png|jpe?g)$/.test(file.type)) { toast.error(`${file.name}: only PNG or JPG images.`); continue; }
      if (file.size > MAX_BYTES) { toast.error(`${file.name} is larger than 10 MB.`); continue; }
      if (next.length >= MAX_FILES) { toast.error(`You can attach up to ${MAX_FILES} files.`); break; }
      next.push(file);
    }
    setFiles(next);
  };

  const toggleAid = (v) => setF((p) => ({ ...p, firstAid: p.firstAid.includes(v) ? p.firstAid.filter((x) => x !== v) : [...p.firstAid, v] }));

  const submit = async (isDraft) => {
    const er = {};
    if (!student) er.student = 'Choose the student this report is about.';
    if (!isDraft) {
      if (!f.location) er.location = 'Select where it happened.';
      if (!f.occurredAt) er.occurredAt = 'Enter when it happened.';
      if (f.description.trim().length < 10) er.description = 'Describe what happened (at least 10 characters).';
    }
    setErrors(er);
    if (Object.keys(er).length) return;
    setBusy(isDraft ? 'draft' : 'submit');
    try {
      const incident = await incidentService.create({
        studentId: student.id, type: f.type, location: f.location || null, occurredAt: f.occurredAt ? new Date(f.occurredAt).toISOString() : null,
        description: f.description.trim() || null, firstAid: f.firstAid, notifyParent: f.notifyParent, isDraft,
      });
      for (const file of files) await incidentService.uploadAttachment(incident.id, file);
      toast.success(isDraft ? 'Draft saved.' : 'Incident report submitted.');
      navigate('/app/incidents/log');
    } catch (err) {
      if (err.errors) setErrors(err.errors); else toast.error(err.message);
    } finally { setBusy(''); }
  };

  return (
    <>
      <PageHeader
        title="Injury/ Incident Reporting"
        subtitle={student ? (
          <span>New Report for Student ID: <b className="text-brand">#{student.admissionNo}</b> ({student.name}) <button onClick={() => setStudent(null)} className="ml-2 text-sm font-semibold text-brand-dark underline-offset-2 hover:underline">Change</button></span>
        ) : 'Choose a student to start a new report'}
        actions={<Button variant="soft" onClick={() => navigate('/app/incidents/log')}>Incident log</Button>}
      />
      {!student && <div className="mb-6"><StudentPicker onPick={(s) => { setStudent(s); setErrors({ ...errors, student: undefined }); }} />{errors.student && <p className="mt-1 text-xs text-danger">{errors.student}</p>}</div>}

      <div className="grid gap-8 lg:grid-cols-[1fr_330px]">
        <div className="space-y-6">
          <fieldset>
            <legend className="label">Type of Incident <span className="text-danger">*</span></legend>
            <div className="grid grid-cols-3 gap-3">
              {INCIDENT_TYPES.map((t) => {
                const Icon = TYPE_ICON[t.value];
                const on = f.type === t.value;
                return (
                  <button key={t.value} type="button" onClick={() => setF({ ...f, type: t.value })} aria-pressed={on} className={cx('flex h-[86px] flex-col items-center justify-center gap-2 rounded-xl border text-sm font-semibold transition', on ? 'border-brand bg-mint-50 text-ink' : 'border-line text-muted hover:border-brand/50')}>
                    <Icon className={cx('h-6 w-6', on ? 'text-brand' : 'text-muted')} />{t.label}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Location" required error={errors.location}>
              <Select value={f.location} onChange={(e) => setF({ ...f, location: e.target.value })} invalid={!!errors.location}><option value="">Select location...</option>{INCIDENT_LOCATIONS.map((l) => <option key={l}>{l}</option>)}</Select>
            </Field>
            <Field label="Date & Time of Occurrence" required error={errors.occurredAt}>
              <Input type="datetime-local" value={f.occurredAt} max={toDateTimeInput()} onChange={(e) => setF({ ...f, occurredAt: e.target.value })} invalid={!!errors.occurredAt} />
            </Field>
          </div>

          <Field label="Detailed Description" required error={errors.description} hint="Please provide objective details. Avoid speculation.">
            <Textarea rows={6} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} placeholder="Describe exactly what happened, including sequence of events..." invalid={!!errors.description} />
          </Field>

          <fieldset>
            <legend className="label">First Aid Administered</legend>
            <div className="flex flex-wrap gap-2.5">
              {FIRST_AID_OPTIONS.map((o) => {
                const on = f.firstAid.includes(o.value);
                return <button key={o.value} type="button" onClick={() => toggleAid(o.value)} aria-pressed={on} className={cx('rounded-full border px-4 py-1.5 text-xs font-medium transition', on ? 'border-brand bg-brand text-white' : 'border-line text-muted hover:border-brand/50')}>{o.label}</button>;
              })}
            </div>
          </fieldset>
        </div>

        <div className="border-line lg:border-l lg:pl-8">
          <p className="label mb-0">Evidence / Attachments</p>
          <p className="mb-3 text-sm text-muted">(Optional)</p>
          <div
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={(e) => { e.preventDefault(); setDrag(false); addFiles(e.dataTransfer.files); }}
            className={cx('flex min-h-[260px] flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-5 text-center transition', drag ? 'border-brand bg-mint-50' : 'border-[#F3B6C4] bg-[#FFFBFC]')}
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#D9F8DD] text-brand"><ImagePlus className="h-5 w-5" /></span>
            <p className="text-xs"><button type="button" onClick={() => fileRef.current?.click()} className="font-semibold text-brand hover:underline">Upload a file</button> or drag and drop</p>
            <p className="text-[11px] text-muted">PNG, JPG, up to 10MB</p>
            <input ref={fileRef} type="file" accept="image/png,image/jpeg" multiple className="sr-only" onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }} aria-label="Upload evidence" />
          </div>
          {files.length > 0 && (
            <ul className="mt-3 space-y-2">
              {files.map((file, i) => (
                <li key={file.name + i} className="flex items-center gap-2 rounded-lg bg-mint-50 px-3 py-2 text-xs"><span className="min-w-0 flex-1 truncate font-medium">{file.name}</span><span className="text-muted">{formatBytes(file.size)}</span><button type="button" onClick={() => setFiles(files.filter((_, j) => j !== i))} aria-label={`Remove ${file.name}`} className="text-muted hover:text-danger"><X className="h-3.5 w-3.5" /></button></li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-5">
        <label className="flex items-center gap-3"><Switch checked={f.notifyParent} onChange={(v) => setF({ ...f, notifyParent: v })} label="Parent notification" /><span><span className="block text-xs font-semibold">Parent Notification</span><span className="block text-[11px] text-muted">Automatically send email report to registered guardian.</span></span></label>
        <div className="flex gap-3">
          <Button variant="soft" size="lg" onClick={() => submit(true)} loading={busy === 'draft'} disabled={!!busy}>Save Draft</Button>
          <Button size="lg" icon={Send} onClick={() => submit(false)} loading={busy === 'submit'} disabled={!!busy}>Submit Report</Button>
        </div>
      </div>
    </>
  );
}
