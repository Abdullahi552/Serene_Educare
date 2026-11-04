import { useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import AuthCard from '@/components/layout/AuthCard';
import Button from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Field';
import { useAuth } from '@/context/AuthContext';
import { USE_MOCK } from '@/config/env';

export default function Login() {
  const { user, login } = useAuth();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to={location.state?.from || '/app'} replace />;

  const submit = async (e) => {
    e.preventDefault();
    if (!form.email.trim() || !form.password) return setError('Enter your email and password.');
    setError('');
    setLoading(true);
    try { await login(form.email.trim(), form.password); } catch (err) { setError(err.status === 401 ? 'Wrong email or password.' : err.message); } finally { setLoading(false); }
  };

  return (
    <AuthCard
      title={<>Welcome to<br />Serene EduHealth</>} subtitle="Enter your sign in details to continue"
      footer={<>Don’t have an account? <Link to="/signup" className="font-bold text-ink hover:underline">Sign up.</Link></>}
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        {error && <p role="alert" className="rounded-2xl bg-danger-soft px-4 py-3 text-sm font-medium text-danger-ink">{error}</p>}
        <Field label="Email" htmlFor="email">
          <Input id="email" type="email" autoComplete="email" variant="field" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="admin1@nectarschools.com" />
        </Field>
        <Field label="Password" htmlFor="password">
          <div className="relative">
            <Input id="password" type={show ? 'text' : 'password'} autoComplete="current-password" variant="field" className="pr-12" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" />
            <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-ink">{show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button>
          </div>
        </Field>
        <Button type="submit" size="xl" className="w-full" loading={loading}>Sign in</Button>
        <Link to="/forgot-password" className="flex h-14 w-full items-center justify-center rounded-full bg-mint-100 text-base font-semibold text-muted transition hover:bg-mint-150">Forgot Password?</Link>
        {USE_MOCK && (
          <p className="rounded-2xl bg-mint-50 px-4 py-3 text-xs text-slate">
            <b className="text-ink">Demo mode</b> (no backend connected). Email <code>admin1@nectarschools.com</code>, password <code>password123</code>
          </p>
        )}
      </form>
    </AuthCard>
  );
}
