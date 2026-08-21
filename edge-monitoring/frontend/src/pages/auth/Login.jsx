import { useEffect, useRef, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthShell from './AuthShell';
import Input from '../../components/ui/Input';
import PasswordInput from '../../components/ui/PasswordInput';
import Button from '../../components/ui/Button';
import { useAuth } from '../../lib/auth-context';

export default function Login() {
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const googleButtonRef = useRef(null);
  const googleInitialized = useRef(false); // ensures Google's button is only ever rendered once
  const [form, setForm] = useState({ email: '', password: '' });
  const [state, setState] = useState({ status: 'idle', error: null }); // idle | loading | error
  const googleConfigured = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID && import.meta.env.VITE_GOOGLE_CLIENT_ID !== 'your_google_oauth_client_id');

  const onSubmit = async (e) => {
    e.preventDefault();
    setState({ status: 'loading', error: null });
    try {
      await login(form.email, form.password);
      navigate('/');
    } catch (err) {
      setState({ status: 'error', error: err.message });
    }
  };

  const handleGoogleCredential = useCallback(
    async (response) => {
      setState({ status: 'loading', error: null });
      try {
        await loginWithGoogle(response.credential);
        navigate('/');
      } catch (err) {
        setState({ status: 'error', error: err.message });
      }
    },
    [loginWithGoogle, navigate]
  );
  const handleGoogleCredentialRef = useRef(handleGoogleCredential);
  useEffect(() => {
    handleGoogleCredentialRef.current = handleGoogleCredential;
  }, [handleGoogleCredential]);

  useEffect(() => {
    if (!googleConfigured || googleInitialized.current) return;

    function setup() {
      if (!window.google || !googleButtonRef.current || googleInitialized.current) return;
      googleInitialized.current = true;

      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: (response) => handleGoogleCredentialRef.current(response),
      });

      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: 'outline',
        size: 'large',
        width: '320',
        text: 'continue_with',
        shape: 'pill',
      });
    }

    if (window.google) {
      setup();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = setup;
    document.body.appendChild(script);
  }, [googleConfigured]);

  return (
    <AuthShell>
      <h2 className="text-xl font-semibold text-ink">Sign in</h2>
      <p className="mb-6 mt-1 text-sm text-muted">Welcome back to your edge network.</p>

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Input label="Email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <PasswordInput
          label="Password"
          required
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />

        <div className="flex justify-end -mt-1">
          <Link to="/forgot-password" className="text-xs text-cyan hover:underline">Forgot password?</Link>
        </div>

        {state.status === 'error' && <p className="text-xs text-crimson">{state.error}</p>}

        <Button type="submit" disabled={state.status === 'loading'} className="w-full">
          {state.status === 'loading' ? 'Signing in…' : 'Sign In'}
        </Button>
      </form>

      <div className="my-5 flex items-center gap-3 text-[11px] uppercase tracking-wide text-muted">
        <div className="h-px flex-1 bg-border" /> or <div className="h-px flex-1 bg-border" />
      </div>

      <div className="flex flex-col gap-2.5">
        {googleConfigured ? (
          <div ref={googleButtonRef} className="flex justify-center" />
        ) : (
          <Button variant="ghost" className="w-full" onClick={() => alert('Google sign-in is not configured yet.')}>
            Continue with Google
          </Button>
        )}
        <Link to="/otp-login">
          <Button variant="ghost" className="w-full">Login with Email OTP</Button>
        </Link>
      </div>

      <p className="mt-6 text-center text-sm text-muted">
        Don't have an account? <Link to="/register" className="text-cyan hover:underline">Sign up</Link>
      </p>
    </AuthShell>
  );
}