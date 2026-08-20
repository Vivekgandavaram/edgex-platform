import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import AuthShell from './AuthShell';
import PasswordInput from '../../components/ui/PasswordInput';
import Button from '../../components/ui/Button';
import { endpoints } from '../../lib/api';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [state, setState] = useState({ status: 'idle', error: null });

  const email = params.get('email') || '';
  const token = params.get('token') || params.get('invite') || '';

  const onSubmit = async (e) => {
    e.preventDefault();
    setState({ status: 'loading', error: null });
    try {
      await endpoints.resetPassword({ email, token, password });
      setState({ status: 'success', error: null });
    } catch (err) {
      setState({ status: 'error', error: err.message });
    }
  };

  if (state.status === 'success') {
    return (
      <AuthShell>
        <h2 className="text-xl font-semibold text-ink">Password updated</h2>
        <p className="mt-2 text-sm text-muted">You can now sign in with your new password.</p>
        <Button className="mt-6 w-full" onClick={() => navigate('/login')}>Go to Sign In</Button>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <h2 className="text-xl font-semibold text-ink">Set a new password</h2>
      <p className="mb-6 mt-1 text-sm text-muted">Choose a strong password for {email || 'your account'}.</p>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <PasswordInput label="New password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        {state.status === 'error' && <p className="text-xs text-crimson">{state.error}</p>}
        <Button type="submit" disabled={state.status === 'loading'} className="w-full">
          {state.status === 'loading' ? 'Updating…' : 'Update Password'}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted">
        <Link to="/login" className="text-cyan hover:underline">Back to sign in</Link>
      </p>
    </AuthShell>
  );
}
