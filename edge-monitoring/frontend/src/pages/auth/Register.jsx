import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthShell from './AuthShell';
import Input from '../../components/ui/Input';
import PasswordInput from '../../components/ui/PasswordInput';
import Button from '../../components/ui/Button';
import { endpoints } from '../../lib/api';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [state, setState] = useState({ status: 'idle', error: null });

  const passwordChecks = [
    { label: '8+ characters', pass: form.password.length >= 8 },
    { label: 'Upper & lowercase', pass: /[A-Z]/.test(form.password) && /[a-z]/.test(form.password) },
    { label: 'A number', pass: /[0-9]/.test(form.password) },
  ];

  const onSubmit = async (e) => {
    e.preventDefault();
    setState({ status: 'loading', error: null });
    try {
      await endpoints.register(form);
      setState({ status: 'success', error: null });
    } catch (err) {
      setState({ status: 'error', error: err.message });
    }
  };

  if (state.status === 'success') {
    return (
      <AuthShell>
        <h2 className="text-xl font-semibold text-ink">Check your inbox</h2>
        <p className="mt-2 text-sm text-muted">
          A verification link was queued for {form.email}. If SMTP is not configured in local dev, the link is logged in the backend terminal instead of being emailed.
        </p>
        <Button className="mt-6 w-full" onClick={() => navigate('/login')}>Back to Sign In</Button>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <h2 className="text-xl font-semibold text-ink">Create your account</h2>
      <p className="mb-2 mt-1 text-sm text-muted">Start monitoring your edge network.</p>
      <p className="mb-6 text-xs text-muted">Local dev note: if SMTP is not configured, verification emails are logged in the backend terminal instead of being emailed.</p>

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Input label="Full name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <Input label="Email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <PasswordInput label="Password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />

        <ul className="flex flex-col gap-1">
          {passwordChecks.map((c) => (
            <li key={c.label} className={`text-xs ${c.pass ? 'text-emerald' : 'text-muted'}`}>
              {c.pass ? '✓' : '○'} {c.label}
            </li>
          ))}
        </ul>

        {state.status === 'error' && <p className="text-xs text-crimson">{state.error}</p>}

        <Button type="submit" disabled={state.status === 'loading'} className="w-full">
          {state.status === 'loading' ? 'Creating account…' : 'Create Account'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Already have an account? <Link to="/login" className="text-cyan hover:underline">Sign in</Link>
      </p>
    </AuthShell>
  );
}
