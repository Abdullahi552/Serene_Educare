import { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthCard from '@/components/layout/AuthCard';
import Button from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Field';
import { authService } from '@/services/authService';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError('Enter a valid email.');
    setError(''); setLoading(true);
    try { await authService.forgotPassword(email.trim()); setSent(true); } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  return (
    <AuthCard title="Forgot password?" subtitle="We will email you a link to choose a new one." footer={<Link to="/login" className="font-bold text-ink hover:underline">Back to sign in</Link>}>
      {sent ? (
        <p className="rounded-2xl bg-mint-50 p-4 text-sm text-slate">If an account exists for <b>{email}</b>, a reset link is on its way. Check your inbox.</p>
      ) : (
        <form onSubmit={submit} className="space-y-4" noValidate>
          <Field label="Email" error={error}><Input type="email" variant="field" value={email} onChange={(e) => setEmail(e.target.value)} invalid={!!error} autoFocus /></Field>
          <Button type="submit" size="xl" className="w-full" loading={loading}>Send reset link</Button>
        </form>
      )}
    </AuthCard>
  );
}
