import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { Field, Input, Select, Textarea } from '@/components/ui/Field';
import { useAsync } from '@/hooks/useAsync';
import { useToast } from '@/context/ToastContext';
import { activityService, schoolService } from '@/services/healthService';
import { ACTIVITY_CATEGORIES, ACTIVITY_STATUSES } from '@/lib/constants';
import { toDateInput } from '@/lib/format';

export default function RecordActivityModal({ activity, onClose, onSaved }) {
  const toast = useToast();
  const editing = Boolean(activity);
  const users = useAsync(() => schoolService.users({ limit: 100 }), []);
  const [f, setF] = useState({
    title: activity?.title || '', category: activity?.category || 'hygiene', date: activity?.date || toDateInput(),
    assigneeId: activity?.assignee?.id ?? '', status: activity?.status || 'pending', notes: activity?.notes || '',
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    const er = {};
    if (!f.title.trim()) er.title = 'Give the activity a name.';
    if (!f.date) er.date = 'Pick a date.';
    setErrors(er);
    if (Object.keys(er).length) return;
    setSaving(true);
    const body = { title: f.title.trim(), category: f.category, date: f.date, assigneeId: f.assigneeId === '' ? null : Number(f.assigneeId), status: f.status, notes: f.notes.trim() || null };
    try {
      const saved = editing ? await activityService.update(activity.id, body) : await activityService.create(body);
      toast.success(editing ? 'Activity updated.' : 'Activity recorded.');
      onSaved(saved);
    } catch (err) { if (err.errors) setErrors(err.errors); else toast.error(err.message); } finally { setSaving(false); }
  };

  return (
    <Modal
      onClose={onClose} title={editing ? 'Edit activity' : 'Record new activity'}
      footer={<><Button variant="soft" onClick={onClose}>Cancel</Button><Button type="submit" form="activity-form" loading={saving}>{editing ? 'Save changes' : 'Record activity'}</Button></>}
    >
      <form id="activity-form" onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Activity name" required error={errors.title}><Input value={f.title} onChange={set('title')} placeholder="e.g. Monthly Water Tank Cleaning" invalid={!!errors.title} autoFocus /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Category" required><Select value={f.category} onChange={set('category')}>{ACTIVITY_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}</Select></Field>
          <Field label="Date" required error={errors.date}><Input type="date" value={f.date} onChange={set('date')} invalid={!!errors.date} /></Field>
          <Field label="Assigned to"><Select value={f.assigneeId} onChange={set('assigneeId')}><option value="">Unassigned</option>{users.data?.data?.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</Select></Field>
          <Field label="Status"><Select value={f.status} onChange={set('status')}>{ACTIVITY_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}</Select></Field>
        </div>
        <Field label="Notes (optional)"><Textarea rows={3} value={f.notes} onChange={set('notes')} /></Field>
      </form>
    </Modal>
  );
}
