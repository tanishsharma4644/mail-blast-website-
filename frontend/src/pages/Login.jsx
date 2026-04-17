import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

import { useAuth } from '../hooks/useAuth';
import OTPInput from '../components/OTPInput';

const OTP_EXPIRY_SECONDS = 10 * 60;
const RESEND_SECONDS = 60;

function formatMMSS(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function Login() {
  const { sendLoginOtp, verifyLoginOtp } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState('');
  const [email, setEmail] = useState('');
  const [otpSeconds, setOtpSeconds] = useState(OTP_EXPIRY_SECONDS);
  const [resendSeconds, setResendSeconds] = useState(RESEND_SECONDS);
  const navigate = useNavigate();
  const location = useLocation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: { email: '' },
  });

  const canResend = resendSeconds <= 0;
  const otpTimerLabel = useMemo(() => formatMMSS(otpSeconds), [otpSeconds]);

  useEffect(() => {
    if (step !== 2) return undefined;

    const interval = setInterval(() => {
      setOtpSeconds((prev) => Math.max(0, prev - 1));
      setResendSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [step]);

  const onSendOtp = async (values) => {
    try {
      setSubmitting(true);
      await sendLoginOtp(values);
      setEmail(values.email);
      setStep(2);
      setOtp('');
      setOtpSeconds(OTP_EXPIRY_SECONDS);
      setResendSeconds(RESEND_SECONDS);
      toast.success('OTP sent to your email');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not send OTP');
    } finally {
      setSubmitting(false);
    }
  };

  const onVerifyOtp = async () => {
    if (otp.length !== 6) {
      toast.error('Please enter 6-digit OTP');
      return;
    }

    try {
      setSubmitting(true);
      await verifyLoginOtp({ email, otp });
      toast.success('Welcome back');
      navigate(location.state?.from?.pathname || '/dashboard', { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.message || 'OTP verification failed');
    } finally {
      setSubmitting(false);
    }
  };

  const onResendOtp = async () => {
    if (!canResend || !email) return;
    await onSendOtp({ email });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-app-bg px-4">
      <div className="w-full max-w-md rounded-2xl border border-app-border bg-app-card p-6 shadow-card">
        <h1 className="text-2xl font-bold">Sign in</h1>
        <p className="mt-1 text-sm text-app-muted">Enter your email and sign in with OTP.</p>

        <div className="mt-4 flex gap-2 text-xs">
          <span className={`rounded-full px-3 py-1 ${step === 1 ? 'bg-app-accent text-white' : 'border border-app-border text-app-muted'}`}>
            Step 1: Email
          </span>
          <span className={`rounded-full px-3 py-1 ${step === 2 ? 'bg-app-accent text-white' : 'border border-app-border text-app-muted'}`}>
            Step 2: OTP
          </span>
        </div>

        {step === 1 && (
          <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSendOtp)}>
            <div>
              <label className="mb-1 block text-sm text-app-muted">Email</label>
              <input
                {...register('email', { required: 'Email is required' })}
                type="email"
                placeholder="example@mail.com"
                className="w-full rounded-lg border border-app-border bg-app-bg px-3 py-2"
              />
              {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-app-accent py-2 font-semibold text-white disabled:opacity-60"
            >
              {submitting ? 'Sending OTP...' : 'Send OTP'}
            </button>
          </form>
        )}

        {step === 2 && (
          <div className="mt-6 space-y-4">
            <p className="text-sm text-app-muted">
              OTP sent to <span className="font-semibold text-app-text">{email}</span>
            </p>

            <OTPInput value={otp} onChange={setOtp} />

            <div className="rounded-lg border border-app-border bg-app-bg p-3 text-sm text-app-muted">
              <p>OTP expires in: <span className="font-semibold text-app-text">{otpTimerLabel}</span></p>
              <button
                type="button"
                onClick={onResendOtp}
                disabled={!canResend || submitting}
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
                onClick={onVerifyOtp}
                disabled={submitting || otp.length !== 6}
                className="w-full rounded-lg bg-app-accent py-2 font-semibold text-white disabled:opacity-60"
              >
                {submitting ? 'Verifying...' : 'Verify & Login'}
              </button>
            </div>
          </div>
        )}

        <p className="mt-4 text-sm text-app-muted">
          New here?{' '}
          <Link to="/register" className="text-app-accent hover:underline">
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
}
