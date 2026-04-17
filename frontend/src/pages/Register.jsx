import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

import OTPInput from '../components/OTPInput';
import { useAuth } from '../hooks/useAuth';

const OTP_EXPIRY_SECONDS = 10 * 60;
const RESEND_SECONDS = 60;

function formatMMSS(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function Register() {
  const { sendOtp, verifyOtp } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState('');
  const [identity, setIdentity] = useState(null);
  const [otpSeconds, setOtpSeconds] = useState(OTP_EXPIRY_SECONDS);
  const [resendSeconds, setResendSeconds] = useState(RESEND_SECONDS);
  const [loading, setLoading] = useState(false);

  const canResend = resendSeconds <= 0;

  const registerForm = useForm({
    defaultValues: { name: '', email: '' },
  });

  useEffect(() => {
    if (step !== 2) return undefined;

    const interval = setInterval(() => {
      setOtpSeconds((prev) => Math.max(0, prev - 1));
      setResendSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [step]);

  const otpTimerLabel = useMemo(() => formatMMSS(otpSeconds), [otpSeconds]);

  const onSendOtp = async (values) => {
    try {
      setLoading(true);
      await sendOtp(values);
      setIdentity(values);
      setStep(2);
      setOtp('');
      setOtpSeconds(OTP_EXPIRY_SECONDS);
      setResendSeconds(RESEND_SECONDS);
      toast.success('OTP sent to your email');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not send OTP');
    } finally {
      setLoading(false);
    }
  };

  const onVerify = async () => {
    if (otp.length !== 6) {
      toast.error('Please enter 6-digit OTP');
      return;
    }

    try {
      setLoading(true);
      await verifyOtp({ email: identity.email, otp });
      toast.success('Account verified');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  const onResend = async () => {
    if (!canResend || !identity) return;
    await onSendOtp(identity);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-app-bg px-4">
      <div className="w-full max-w-lg rounded-2xl border border-app-border bg-app-card p-6 shadow-card">
        <h1 className="text-2xl font-bold">Create account</h1>
        <p className="mt-1 text-sm text-app-muted">Signup with any valid email. OTP will be sent to that address.</p>

        <div className="mt-4 flex gap-2 text-xs">
          <span className={`rounded-full px-3 py-1 ${step === 1 ? 'bg-app-accent text-white' : 'border border-app-border text-app-muted'}`}>
            Step 1: Details
          </span>
          <span className={`rounded-full px-3 py-1 ${step === 2 ? 'bg-app-accent text-white' : 'border border-app-border text-app-muted'}`}>
            Step 2: OTP
          </span>
        </div>

        {step === 1 && (
          <form className="mt-6 space-y-4" onSubmit={registerForm.handleSubmit(onSendOtp)}>
            <div>
              <label className="mb-1 block text-sm text-app-muted">Name</label>
              <input
                {...registerForm.register('name', { required: 'Name is required' })}
                className="w-full rounded-lg border border-app-border bg-app-bg px-3 py-2"
              />
              {registerForm.formState.errors.name && (
                <p className="mt-1 text-xs text-red-400">{registerForm.formState.errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm text-app-muted">Email</label>
              <input
                {...registerForm.register('email', { required: 'Email is required' })}
                type="email"
                className="w-full rounded-lg border border-app-border bg-app-bg px-3 py-2"
                placeholder="example@mail.com"
              />
              {registerForm.formState.errors.email && (
                <p className="mt-1 text-xs text-red-400">{registerForm.formState.errors.email.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-app-accent py-2 font-semibold text-white disabled:opacity-60"
            >
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </button>
          </form>
        )}

        {step === 2 && (
          <div className="mt-6 space-y-4">
            <p className="text-sm text-app-muted">
              OTP sent to <span className="font-semibold text-app-text">{identity?.email}</span>
            </p>

            <OTPInput value={otp} onChange={setOtp} />

            <div className="rounded-lg border border-app-border bg-app-bg p-3 text-sm text-app-muted">
              <p>OTP expires in: <span className="font-semibold text-app-text">{otpTimerLabel}</span></p>
              <button
                type="button"
                onClick={onResend}
                disabled={!canResend || loading}
                className="mt-2 text-app-accent disabled:opacity-40"
              >
                Resend OTP {canResend ? '' : `in ${resendSeconds}s`}
              </button>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full rounded-lg border border-app-border py-2"
              >
                Back
              </button>
              <button
                type="button"
                onClick={onVerify}
                disabled={loading || otp.length !== 6}
                className="w-full rounded-lg bg-app-accent py-2 font-semibold text-white disabled:opacity-60"
              >
                {loading ? 'Verifying...' : 'Verify & Register'}
              </button>
            </div>
          </div>
        )}

        <p className="mt-4 text-sm text-app-muted">
          Already registered?{' '}
          <Link to="/login" className="text-app-accent hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
