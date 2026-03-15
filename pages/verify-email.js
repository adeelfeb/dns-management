import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Navbar from '../components/designndev/Navbar';
import Footer from '../components/designndev/Footer';
import { safeParseJsonResponse } from '../utils/safeJsonResponse';

function formatErrorMessage(payload, fallback) {
  if (!payload) return fallback;
  const detail =
    typeof payload.error === 'string'
      ? payload.error
      : Array.isArray(payload.error)
      ? payload.error.join(', ')
      : '';
  if (detail) {
    return `${payload.message || fallback}: ${detail}`;
  }
  return payload.message || fallback;
}

export default function VerifyEmailPage() {
  const router = useRouter();
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  
  const email = router.query.email || '';

  useEffect(() => {
    // If no email is provided, redirect back to login
    if (router.isReady && !email) {
      router.replace('/login');
    }
  }, [router.isReady, email, router]);

  // Initialize 40 second cooldown when component mounts
  useEffect(() => {
    if (router.isReady && email) {
      // Start with 40 second cooldown when page loads
      setResendCooldown(40);
    }
  }, [router.isReady, email]);

  // Handle resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const isDisabled = useMemo(() => {
    return loading || !otp.trim() || otp.trim().length < 4;
  }, [otp, loading]);

  async function onResend(e) {
    e.preventDefault();
    if (resending || !email || resendCooldown > 0) return;
    
    setResending(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      
      const data = await safeParseJsonResponse(res);
      
      if (!res.ok) {
        setError(data.message || 'Failed to resend code');
      } else {
        setSuccess('Verification code sent! Please check your email.');
        // Start 40 second cooldown timer
        setResendCooldown(40);
      }
    } catch (err) {
      setError('Failed to resend code. Please try again.');
    } finally {
      setResending(false);
    }
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (isDisabled) return;
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, otp: otp.trim() }),
      });
      
      const text = await res.text();
      let data = {};
      
      if (text && text.trim()) {
        try {
          data = JSON.parse(text);
        } catch (parseErr) {
            setError("Server error. Please try again.");
            setLoading(false);
            return;
        }
      }
      
      if (!res.ok || !data.success) {
        setError(formatErrorMessage(data, "Verification failed"));
        setLoading(false);
        return;
      }
      
      // Success
      setSuccess('Email verified successfully!');
      
      if (data.data && data.data.token) {
        localStorage.setItem('token', data.data.token);
      }
      
      // Redirect immediately - cookies are set synchronously
      // Use window.location for hash navigation as Next.js router doesn't handle hashes well
      window.location.href = '/dashboard#blogs';
      
    } catch (err) {
      setError(err.message || "Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!router.isReady) return null;

  return (
    <div className="min-h-screen flex flex-col bg-[#faf8f5]">
      <Navbar />
      <div className="flex-1 flex items-center justify-center px-4 pt-24 pb-16 sm:pt-32 sm:pb-20 bg-gradient-to-b from-teal-50/80 via-[#faf8f5] to-teal-50/50">
        <div className="w-full max-w-[420px] p-6 sm:p-8 rounded-2xl bg-white/95 backdrop-blur-sm shadow-xl shadow-stone-200/50 border border-stone-200/80 flex flex-col gap-6">
          <header>
            <h1 className="text-2xl font-bold text-stone-900 mb-1">Verify your email</h1>
            <p className="text-stone-600 text-sm">We've sent a verification code to <strong className="text-stone-900">{email}</strong></p>
            {resendCooldown > 0 && (
              <p className="mt-2 text-stone-500 text-sm italic py-3 px-4 bg-teal-50 border-l-4 border-teal-500 rounded-r-lg">
                Wait for a while if you haven't received it, then resend.
              </p>
            )}
          </header>

          {error && (
            <div className="rounded-xl py-3 px-4 bg-red-50 text-red-700 border border-red-200 font-medium" role="alert" aria-live="assertive">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-xl py-3 px-4 bg-teal-50 text-teal-800 border border-teal-200 font-medium" role="alert" aria-live="polite">
              {success}
            </div>
          )}

          <form onSubmit={onSubmit} className="grid gap-5 w-full" noValidate>
            <label className="grid gap-2">
              <span className="font-semibold text-stone-800 text-sm">Verification Code</span>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                id="otp"
                name="otp"
                placeholder="Enter 6-digit code"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                disabled={loading}
                className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
              />
            </label>

            <button
              type="submit"
              disabled={isDisabled}
              className="w-full flex items-center justify-center gap-2 py-3 px-5 rounded-xl font-semibold text-white bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 disabled:opacity-70 transition-all shadow-lg shadow-teal-500/25"
            >
              {loading && <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" aria-hidden="true" />}
              <span>{loading ? 'Verifying…' : 'Verify Email'}</span>
            </button>

            <div className="text-center mt-1">
              <button
                type="button"
                onClick={onResend}
                disabled={resending || resendCooldown > 0}
                className="text-sm font-medium text-teal-600 hover:underline disabled:opacity-70 disabled:no-underline"
              >
                {resending ? 'Sending...' : resendCooldown > 0 ? `Resend Code (${resendCooldown}s)` : 'Resend Code'}
              </button>
            </div>
          </form>

          <footer className="flex justify-center gap-2 text-[0.95rem] text-stone-600">
            <span>Wrong email?</span>
            <Link href="/signup" className="font-semibold text-teal-600 hover:underline">Create a new account</Link>
          </footer>
        </div>
      </div>

      <Footer />
    </div>
  );
}

