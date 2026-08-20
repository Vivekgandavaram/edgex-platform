import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthShell from './AuthShell';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { endpoints } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';

const RESEND_SECONDS = 30;

export default function OtpLogin() {
  const { loginWithOtp } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState('email'); // email | code
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [state, setState] = useState({ status: 'idle', error: null });
  const [resendSeconds, setResendSeconds] = useState(0);

  useEffect(() => {
    if (step !== 'code' || resendSeconds <= 0) return;

    const timer = setInterval(() => {
      setResendSeconds((value) => {
        if (value <= 1) {
          clearInterval(timer);
          return 0;
        }
        return value - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [step, resendSeconds]);

  const sendCode = async (e) => {
    if (e) e.preventDefault();
    setState({ status: 'loading', error: null });
    try {
      await endpoints.requestOtp(email);
      setState({ status: 'idle', error: null });
      setCode('');
      setResendSeconds(RESEND_SECONDS);
      setStep('code');
    } catch (err) {
      setState({ status: 'error', error: err.message });
    }
  };

  const verify = async (e) => {
    e.preventDefault();
    setState({ status: 'loading', error: null });
    try {
      await loginWithOtp(email, code);
      navigate('/');
    } catch (err) {
      setState({ status: 'error', error: err.message });
    }
  };

  const handleDifferentEmail = () => {
    setCode('');
    setState({ status: 'idle', error: null });
    setResendSeconds(0);
    setStep('email');
  };

  return (
    <AuthShell>
      <h2 className="text-xl font-semibold text-ink">{step === 'email' ? 'Login with Email OTP' : 'Enter your code'}</h2>
      <p className="mb-6 mt-1 text-sm text-muted">
        {step === 'email' ? "We'll send a 6-digit code to your email." : `Sent to ${email}. Codes expire after 10 minutes.`}
      </p>

      {step === 'email' ? (
        <form onSubmit={sendCode} className="flex flex-col gap-4">
          <Input label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          {state.status === 'error' && <p className="text-xs text-crimson">{state.error}</p>}
          <Button type="submit" disabled={state.status === 'loading'} className="w-full">
            {state.status === 'loading' ? 'Sending…' : 'Send Code'}
          </Button>
        </form>
      ) : (
        <form onSubmit={verify} className="flex flex-col gap-4">
          <Input
            label="6-digit code"
            required
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            className="tracking-[0.5em] text-center font-tabular"
          />
          {state.status === 'error' && <p className="text-xs text-crimson">{state.error}</p>}

          <div className="flex items-center justify-between gap-3 text-xs text-muted">
            {resendSeconds > 0 ? (
              <span>Resend code in {resendSeconds}s</span>
            ) : (
              <button type="button" onClick={sendCode} className="font-medium text-cyan hover:text-cyan/80 disabled:cursor-not-allowed disabled:opacity-50">
                Resend code
              </button>
            )}
            <button type="button" onClick={handleDifferentEmail} className="hover:text-ink">Use a different email</button>
          </div>

          <Button type="submit" disabled={state.status === 'loading'} className="w-full">
            {state.status === 'loading' ? 'Verifying…' : 'Verify & Sign In'}
          </Button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-muted">
        <Link to="/login" className="text-cyan hover:underline">Back to sign in</Link>
      </p>
    </AuthShell>
  );
}
