import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import AuthCard from '@/components/layout/AuthCard';
import Button from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Field';
import { authService } from '@/services/authService';

/** Target of the emailed link: /reset-password?token=... */
export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const [f, setF] = useState({ password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const er = {};
    if (f.password.length < 8) er.password = 'Use at least 8 characters.';
    if (f.password !== f.confirm) er.confirm = 'Passwords do not match.';
    setErrors(er);
    if (Object.keys(er).length) return;
    setLoading(true);
    try { await authService.resetPassword(token, f.password); setDone(true); } catch (err) { setErrors({ password: err.errors?.newPassword || err.message }); } finally { setLoading(false); }
  };

  return (
    <AuthCard title="Choose a new password" footer={<Link to="/login" className="font-bold text-ink hover:underline">Back to sign in</Link>}>
      {!token ? <p className="rounded-2xl bg-danger-soft p-4 text-sm text-danger-ink">This reset link is missing its token. Request a new one.</p>
        : done ? <><p className="rounded-2xl bg-mint-50 p-4 text-sm text-slate">Your password has been changed.</p><Link to="/login" className="mt-4 block"><Button size="xl" className="w-full">Sign in</Button></Link></>
        : (
          <form onSubmit={submit} className="space-y-4" noValidate>
            <Field label="New password" error={errors.password}><Input type="password" variant="field" autoComplete="new-password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} invalid={!!errors.password} /></Field>
            <Field label="Confirm password" error={errors.confirm}><Input type="password" variant="field" autoComplete="new-password" value={f.confirm} onChange={(e) => setF({ ...f, confirm: e.target.value })} invalid={!!errors.confirm} /></Field>
            <Button type="submit" size="xl" className="w-full" loading={loading}>Change password</Button>
          </form>
        )}
    </AuthCard>
  );
}
