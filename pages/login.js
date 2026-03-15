import { useMemo, useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Eye, EyeOff } from 'lucide-react';
import Navbar from '../components/designndev/Navbar';
import Footer from '../components/designndev/Footer';
import { AuthCardSkeleton } from '../components/Skeleton';
import { useRecaptcha } from '../utils/useRecaptcha';
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

// Helper to detect and break redirect loops
function shouldSkipAuthRedirect() {
  if (typeof window === 'undefined') return false;
  
  const redirectKey = 'auth_redirect_count';
  const redirectTimeKey = 'auth_redirect_time';
  const now = Date.now();
  const lastRedirectTime = parseInt(sessionStorage.getItem(redirectTimeKey) || '0', 10);
  const redirectCount = parseInt(sessionStorage.getItem(redirectKey) || '0', 10);
  
  // Reset counter if more than 5 seconds have passed
  if (now - lastRedirectTime > 5000) {
    sessionStorage.setItem(redirectKey, '0');
    sessionStorage.setItem(redirectTimeKey, String(now));
    return false;
  }
  
  // If we've redirected more than 2 times in 5 seconds, we're in a loop
  if (redirectCount >= 2) {
    console.warn('[Login] Redirect loop detected, clearing auth state');
    // Clear potentially stale auth state
    localStorage.removeItem('token');
    sessionStorage.removeItem(redirectKey);
    sessionStorage.removeItem(redirectTimeKey);
    return true;
  }
  
  return false;
}

function incrementRedirectCount() {
  if (typeof window === 'undefined') return;
  const redirectKey = 'auth_redirect_count';
  const redirectTimeKey = 'auth_redirect_time';
  const count = parseInt(sessionStorage.getItem(redirectKey) || '0', 10);
  sessionStorage.setItem(redirectKey, String(count + 1));
  sessionStorage.setItem(redirectTimeKey, String(Date.now()));
}

export default function LoginPage() {
  const router = useRouter();
  const { execute: executeRecaptcha, isAvailable: recaptchaAvailable } = useRecaptcha();
  const [identifier, setIdentifier] = useState(''); // Can be email or username
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const hasCheckedAuth = useRef(false);
  // When login is blocked by unverified email, show verification code input
  const [needsVerification, setNeedsVerification] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');

  // Get redirect destination from query params - memoize to prevent unnecessary re-renders
  const redirectTo = useMemo(() => {
    return router.query.redirect || '/dashboard';
  }, [router.query.redirect]);

  // Check if user is already authenticated and redirect to dashboard
  useEffect(() => {
    // Only check auth once and wait for router to be ready
    if (!router.isReady || hasCheckedAuth.current) {
      return; // Wait for router to be ready or already checked
    }

    hasCheckedAuth.current = true;

    async function checkAuth() {
      try {
        // Check for redirect loop first
        if (shouldSkipAuthRedirect()) {
          setCheckingAuth(false);
          return;
        }
        
        // Check if token exists in localStorage first for faster check
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        
        // If no token, skip API call and show login form immediately
        if (!token) {
          setCheckingAuth(false);
          return;
        }
        
        // Call /api/auth/me WITHOUT Authorization header to check cookie-only auth
        // This matches what SSR will see, preventing redirect loops
        const res = await fetch('/api/auth/me', {
          method: 'GET',
          credentials: 'include', // Include cookies only
        });

        // If request fails, clear localStorage and show login page
        if (!res.ok) {
          localStorage.removeItem('token');
          setCheckingAuth(false);
          return;
        }

        const data = await safeParseJsonResponse(res);
        
        // If user is authenticated via COOKIE (not just localStorage), redirect to dashboard
        if (data.success && data.data && data.data.user) {
          // Sync localStorage with cookie-based token
          if (data.data.token && typeof window !== 'undefined') {
            localStorage.setItem('token', data.data.token);
          }
          
          // Track redirect to detect loops
          incrementRedirectCount();
          
          // Get redirect destination from query params at redirect time
          const redirectDestination = router.query.redirect || '/dashboard';
          
          // Use router.replace instead of window.location to let Next.js handle it properly
          // Add hash as a separate step to avoid router issues
          if (redirectDestination === '/dashboard' || !router.query.redirect) {
            router.replace('/dashboard').then(() => {
              // Set hash after navigation completes
              if (typeof window !== 'undefined') {
                window.location.hash = 'overview';
              }
            });
          } else {
            router.replace(redirectDestination);
          }
          return;
        } else {
          // Cookie auth failed but localStorage has token - they're out of sync
          // Clear localStorage to prevent redirect loops
          localStorage.removeItem('token');
        }
      } catch (err) {
        // If check fails, clear potentially stale token and show login page
        console.log('[Login] Auth check failed, showing login page:', err);
        localStorage.removeItem('token');
      } finally {
        setCheckingAuth(false);
      }
    }

    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady]);

  // Optimized validation - check immediately on input change
  const isDisabled = useMemo(() => {
    // Fast validation without blocking
    if (loading) return true;
    const identifierValid = identifier.trim().length > 0;
    const passwordValid = password.length >= 5;
    return !identifierValid || !passwordValid;
  }, [identifier, password, loading]);

  const isVerifyDisabled = useMemo(() => {
    if (loading) return true;
    return !verificationCode.trim() || verificationCode.trim().length < 4;
  }, [verificationCode, loading]);

  async function onVerifySubmit(e) {
    e.preventDefault();
    if (isVerifyDisabled) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: pendingEmail, otp: verificationCode.trim() }),
      });
      const text = await res.text();
      let data = {};
      if (text && text.trim()) {
        try {
          data = JSON.parse(text);
        } catch {
          setError('Server error. Please try again.');
          setLoading(false);
          return;
        }
      }
      if (!res.ok || !data.success) {
        setError(formatErrorMessage(data, 'Invalid or expired code. Try again or request a new one.'));
        setLoading(false);
        return;
      }
      if (data.data && data.data.token) {
        localStorage.setItem('token', data.data.token);
      }
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('auth_redirect_count');
        sessionStorage.removeItem('auth_redirect_time');
      }
      const redirectDest = router.query.redirect || '/dashboard';
      if (redirectDest === '/dashboard' || !router.query.redirect) {
        router.replace('/dashboard').then(() => {
          if (typeof window !== 'undefined') {
            window.location.hash = 'overview';
          }
        });
      } else {
        router.replace(redirectDest);
      }
    } catch (err) {
      console.error('[Login] Verify error', err);
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function backToSignIn() {
    setNeedsVerification(false);
    setPendingEmail('');
    setVerificationCode('');
    setError('');
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (isDisabled) return;
    setLoading(true);
    setError('');

    const recaptchaToken = recaptchaAvailable ? await executeRecaptcha() : null;
    if (recaptchaAvailable && !recaptchaToken) {
      setError('Security verification failed. Please refresh and try again.');
      setLoading(false);
      return;
    }

    try {
      const trimmedIdentifier = identifier.trim();
      const isEmail = trimmedIdentifier.includes('@');
      
      // Send either email or username based on format
      const loginPayload = { password };
      if (isEmail) {
        loginPayload.email = trimmedIdentifier;
      } else {
        loginPayload.username = trimmedIdentifier;
      }
      if (recaptchaToken) loginPayload.recaptchaToken = recaptchaToken;
      
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Include cookies for session management
        body: JSON.stringify(loginPayload),
      });
      
      const text = await res.text();
      let data = {};
      
      // Safely parse JSON response
      if (text && text.trim()) {
        try {
          data = JSON.parse(text);
        } catch (parseErr) {
          // Invalid JSON response - network or server error
          if (res.status >= 500) {
            setError('Server error. Please try again in a moment.');
          } else if (res.status === 0 || !res.ok) {
            setError('Unable to connect to the server. Please check your internet connection.');
          } else {
            setError("We couldn't sign you in. Please try again.");
          }
          setLoading(false);
          return;
        }
      }
      
      // Handle API errors gracefully
      if (!res.ok || !data.success) {
        // Unverified email: show verification code input (backend already sent a new code)
        if (res.status === 403 && data.needs_verification && data.email) {
          setPendingEmail(data.email);
          setNeedsVerification(true);
          setError('');
          setLoading(false);
          return;
        }
        const errorMessage = formatErrorMessage(data, "We couldn't sign you in with those credentials.");
        setError(errorMessage);
        setLoading(false);
        return;
      }
      
      // Success - store token and redirect immediately
      if (data.data && data.data.token) {
        localStorage.setItem('token', data.data.token);
      }
      
      // Clear redirect loop counter on successful login
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('auth_redirect_count');
        sessionStorage.removeItem('auth_redirect_time');
      }
      
      // Redirect immediately - cookies are set synchronously
      const redirectDest = router.query.redirect || '/dashboard';
      if (redirectDest === '/dashboard' || !router.query.redirect) {
        // Use router.replace then set hash to avoid Next.js router issues
        router.replace('/dashboard').then(() => {
          if (typeof window !== 'undefined') {
            window.location.hash = 'overview';
          }
        });
      } else {
        router.replace(redirectDest);
      }
    } catch (err) {
      console.error('[Login] Error during sign-in flow', err);
      
      // Handle network errors
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        setError('Unable to connect to the server. Please check your internet connection and try again.');
      } else {
        setError(err.message || "We couldn't sign you in. Please check your credentials and try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex flex-col bg-[#faf8f5]">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-4 pt-24 pb-16 sm:pt-32 sm:pb-20 bg-gradient-to-b from-teal-50/80 via-[#faf8f5] to-teal-50/50">
          <AuthCardSkeleton />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="auth-page min-h-screen flex flex-col bg-[#faf8f5]">
      <Navbar />
      <div className="auth-shell flex-1 flex items-center justify-center px-4 pt-24 pb-16 sm:pt-32 sm:pb-20 bg-gradient-to-b from-teal-50/80 via-[#faf8f5] to-teal-50/50">
        <div className="auth-card w-full max-w-[420px] p-6 sm:p-8 rounded-2xl bg-white/95 backdrop-blur-sm shadow-xl shadow-stone-200/50 border border-stone-200/80 flex flex-col gap-6">
          <header className="card-header">
            <h1 className="text-2xl font-bold text-stone-900 mb-1">Welcome back</h1>
          </header>

          {error && (
            <div className="rounded-xl py-3 px-4 bg-red-50 text-red-700 border border-red-200 font-medium" role="alert" aria-live="assertive">
              {error}
            </div>
          )}

          {needsVerification ? (
            <>
              <p className="text-stone-600 text-[0.95rem] leading-relaxed mb-2">
                We&apos;ve sent a verification code to <strong className="text-stone-900">{pendingEmail}</strong>. Enter it below to sign in.
              </p>
              <form onSubmit={onVerifySubmit} className="grid gap-5 w-full" noValidate>
                <label className="grid gap-2">
                  <span className="font-semibold text-stone-800 text-sm">Verification Code</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    id="login-verify-code"
                    name="otp"
                    placeholder="Enter 6-digit code"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    maxLength={6}
                    disabled={loading}
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
                  />
                </label>
                <button
                  type="submit"
                  disabled={isVerifyDisabled}
                  className="w-full flex items-center justify-center gap-2 py-3 px-5 rounded-xl font-semibold text-white bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 disabled:opacity-70 transition-all shadow-lg shadow-teal-500/25"
                >
                  {loading && <span className="spinner w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" aria-hidden="true" />}
                  <span>{loading ? 'Verifying…' : 'Verify & Sign In'}</span>
                </button>
              </form>
              <button type="button" className="mt-1 text-[0.95rem] font-semibold text-teal-600 hover:underline disabled:opacity-70" onClick={backToSignIn} disabled={loading}>
                ← Back to sign in
              </button>
            </>
          ) : (
            <>
              <form onSubmit={onSubmit} className="grid gap-5 w-full" noValidate>
                <label className="grid gap-2">
                  <span className="font-semibold text-stone-800 text-sm">Email or Username</span>
                  <input
                    type="text"
                    inputMode="text"
                    autoComplete="username email"
                    id="login-identifier"
                    name="identifier"
                    placeholder="you@example.com or username"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    required
                    disabled={loading}
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
                  />
                </label>
                <label className="grid gap-2">
                  <span className="font-semibold text-stone-800 text-sm">Password</span>
                  <div className="flex rounded-xl border border-stone-200 bg-white focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-500/20 overflow-hidden">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      id="login-password"
                      name="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={5}
                      disabled={loading}
                      className="flex-1 min-w-0 py-3 px-4 border-0 bg-transparent outline-none"
                    />
                    <span className="flex items-center pr-2">
                      <button
                        type="button"
                        onClick={() => setShowPassword((p) => !p)}
                        tabIndex={-1}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        disabled={loading}
                        className="p-2 text-stone-500 hover:text-stone-700 rounded-lg"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </span>
                  </div>
                </label>
                <button
                  type="submit"
                  disabled={isDisabled}
                  className="w-full flex items-center justify-center gap-2 py-3 px-5 rounded-xl font-semibold text-white bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 disabled:opacity-70 transition-all shadow-lg shadow-teal-500/25"
                >
                  {loading && <span className="spinner w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" aria-hidden="true" />}
                  <span>{loading ? 'Signing you in…' : 'Sign In'}</span>
                </button>
              </form>
            </>
          )}

          <footer className="flex justify-center gap-2 text-[0.95rem] text-stone-600">
            <span>Need an account?</span>
            <Link href="/signup" className="font-semibold text-teal-600 hover:underline">
              Create one here
            </Link>
          </footer>
          <p className="text-center text-sm text-stone-500 mt-2">
            <Link href="/" className="text-teal-600 hover:underline">Use DNS control on all your devices</Link>
          </p>

        </div>
      </div>

      <Footer />
    </div>
  );
}

