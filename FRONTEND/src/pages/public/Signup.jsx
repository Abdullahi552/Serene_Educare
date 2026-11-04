import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import AuthCard from '@/components/layout/AuthCard';
import Button from '@/components/ui/Button';
import { Field, Input, Select, Textarea } from '@/components/ui/Field';
import { authService } from '@/services/authService';
import { useToast } from '@/context/ToastContext';
import { PLANS } from '@/lib/constants';

/** "Get on board": a school asks to be onboarded. (No Figma screen existed; built in the same style.) */
export default function Signup() {
  const toast = useToast();
  const [params] = useSearchParams();
  const [f, setF] = useState({ schoolName: '', contactName: '', email: '', phone: '', studentCount: '', plan: PLANS.some((p) => p.key === params.get('plan')) ? params.get('plan') : '', message: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    const er = {};
    if (!f.schoolName.trim()) er.schoolName = 'Enter your school’s name.';
    if (!f.contactName.trim()) er.contactName = 'Enter a contact person.';
    if (!/^\S+@\S+\.\S+$/.test(f.email)) er.email = 'Enter a valid email.';
    if (f.phone.replace(/\D/g, '').length < 7) er.phone = 'Enter a phone number.';
    if (!(Number(f.studentCount) > 0)) er.studentCount = 'Enter the number of students.';
    setErrors(er);
    if (Object.keys(er).length) return;
    setLoading(true);
    try {
      await authService.requestOnboarding({ ...f, studentCount: Number(f.studentCount), plan: f.plan || null, message: f.message.trim() || null });
      setDone(true);
    } catch (err) { if (err.errors) setErrors(err.errors); else toast.error(err.message); } finally { setLoading(false); }
  };

  if (done) {
    return (
      <AuthCard title="Thank you!" subtitle="We have received your request.">
        <div className="flex items-start gap-3 rounded-2xl bg-mint-50 p-4 text-sm text-slate"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand" />Our team will contact {f.contactName.split(' ')[0] || 'you'} at {f.email} to begin onboarding {f.schoolName}.</div>
        <Link to="/" className="mt-6 block"><Button variant="soft" size="lg" className="w-full">Back to home</Button></Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard title={<>Get on board</>} subtitle="Tell us about your school and we will start onboarding." footer={<>Already have an account? <Link to="/login" className="font-bold text-ink hover:underline">Sign in.</Link></>}>
      <form onSubmit={submit} className="space-y-3.5" noValidate>
        <Field label="School name" required error={errors.schoolName}><Input value={f.schoolName} onChange={set('schoolName')} invalid={!!errors.schoolName} /></Field>
        <div className="grid gap-3.5 sm:grid-cols-2">
          <Field label="Contact person" required error={errors.contactName}><Input value={f.contactName} onChange={set('contactName')} invalid={!!errors.contactName} /></Field>
          <Field label="Phone" required error={errors.phone}><Input type="tel" value={f.phone} onChange={set('phone')} invalid={!!errors.phone} /></Field>
        </div>
        <Field label="Email" required error={errors.email}><Input type="email" value={f.email} onChange={set('email')} invalid={!!errors.email} /></Field>
        <div className="grid gap-3.5 sm:grid-cols-2">
          <Field label="Number of students" required error={errors.studentCount}><Input type="number" min="1" value={f.studentCount} onChange={set('studentCount')} invalid={!!errors.studentCount} /></Field>
          <Field label="Plan of interest"><Select value={f.plan} onChange={set('plan')}><option value="">Not sure yet</option>{PLANS.map((p) => <option key={p.key} value={p.key}>{p.name}</option>)}</Select></Field>
        </div>
        <Field label="Anything we should know? (optional)"><Textarea rows={2} value={f.message} onChange={set('message')} /></Field>
        <Button type="submit" size="xl" className="w-full" loading={loading}>Request onboarding</Button>
      </form>
    </AuthCard>
  );
}
