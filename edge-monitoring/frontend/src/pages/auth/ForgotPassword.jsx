import { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthShell from './AuthShell';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { endpoints } from '../../lib/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState({ status: 'idle', error: null });

  const onSubmit = async (e) => {
    e.preventDefault();
    setState({ status: 'loading', error: null });
    try {
      await endpoints.forgotPassword(email);
      setState({ status: 'sent', error: null });
    } catch (err) {
      setState({ status: 'error', error: err.message });
    }
  };

  if (state.status === 'sent') {
    return (
      <AuthShell>
        <h2 className="text-xl font-semibold text-ink">Check your inbox</h2>
        <p className="mt-2 text-sm text-muted">If an account exists for {email}, a password reset link has been sent.</p>
        <Link to="/login"><Button className="mt-6 w-full">Back to Sign In</Button></Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <h2 className="text-xl font-semibold text-ink">Forgot password?</h2>
      <p className="mb-6 mt-1 text-sm text-muted">We'll email you a secure reset link.</p>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Input label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        {state.status === 'error' && <p className="text-xs text-crimson">{state.error}</p>}
        <Button type="submit" disabled={state.status === 'loading'} className="w-full">
          {state.status === 'loading' ? 'Sending…' : 'Send Reset Link'}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted">
        <Link to="/login" className="text-cyan hover:underline">Back to sign in</Link>
      </p>
    </AuthShell>
  );
}
