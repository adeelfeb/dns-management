import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Eye, EyeOff } from 'lucide-react';
import Navbar from '../components/designndev/Navbar';
import Footer from '../components/designndev/Footer';
import { AuthCardSkeleton } from '../components/Skeleton';
import { useRecaptcha } from '../utils/useRecaptcha';
import { safeParseJsonResponse } from '../utils/safeJsonResponse';

function formatLoginError(payload, fallback) {
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

function formatSignupError(payload, fallback) {
  if (!payload) return fallback;
  if (payload.message) return payload.message;
  return fallback;
}

function shouldSkipAuthRedirect() {
  if (typeof window === 'undefined') return false;
  const redirectKey = 'auth_redirect_count';
  const redirectTimeKey = 'auth_redirect_time';
  const now = Date.now();
  const lastRedirectTime = parseInt(sessionStorage.getItem(redirectTimeKey) || '0', 10);
  const redirectCount = parseInt(sessionStorage.getItem(redirectKey) || '0', 10);
  if (now - lastRedirectTime > 5000) {
    sessionStorage.setItem(redirectKey, '0');
    sessionStorage.setItem(redirectTimeKey, String(now));
    return false;
  }
  if (redirectCount >= 2) {
    console.warn('[Auth] Redirect loop detected, clearing auth state');
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

export default function AuthPage() {
  const router = useRouter();
  const { execute: executeRecaptcha, isAvailable: recaptchaAvailable } = useRecaptcha();
  const [mode, setMode] = useState('login');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const hasCheckedAuth = useRef(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');

  useEffect(() => {
    if (!router.isReady) return;
    setMode(router.query.mode === 'signup' ? 'signup' : 'login');
  }, [router.isReady, router.query.mode]);

  const switchMode = useCallback(
    (next) => {
      setMode(next);
      setError('');
      setNeedsVerification(false);
      setPendingEmail('');
      setVerificationCode('');
      const q = { ...router.query };
      if (next === 'signup') q.mode = 'signup';
      else delete q.mode;
      router.replace({ pathname: '/auth', query: q }, undefined, { shallow: true });
    },
    [router]
  );

  useEffect(() => {
    if (!router.isReady || hasCheckedAuth.current) return;
    hasCheckedAuth.current = true;

    async function checkAuth() {
      try {
        if (shouldSkipAuthRedirect()) {
          setCheckingAuth(false);
          return;
        }
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        if (!token) {
          setCheckingAuth(false);
          return;
        }
        const res = await fetch('/api/auth/me', {
          method: 'GET',
          credentials: 'include',
        });
        if (!res.ok) {
          localStorage.removeItem('token');
          setCheckingAuth(false);
          return;
        }
        const data = await safeParseJsonResponse(res);
        if (data.success && data.data && data.data.user) {
          if (data.data.token && typeof window !== 'undefined') {
            localStorage.setItem('token', data.data.token);
          }
          incrementRedirectCount();
          const redirectDestination = router.query.redirect || '/dashboard';
          if (redirectDestination === '/dashboard' || !router.query.redirect) {
            router.replace('/dashboard').then(() => {
              if (typeof window !== 'undefined') {
                window.location.hash = 'overview';
              }
            });
          } else {
            router.replace(redirectDestination);
          }
          return;
        }
        localStorage.removeItem('token');
      } catch (err) {
        console.log('[Auth] Auth check failed, showing form:', err);
        localStorage.removeItem('token');
      } finally {
        setCheckingAuth(false);
      }
    }

    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady]);

  const isLoginDisabled = useMemo(() => {
    if (loading) return true;
    return !identifier.trim() || password.length < 5;
  }, [identifier, password, loading]);

  const isVerifyDisabled = useMemo(() => {
    if (loading) return true;
    return !verificationCode.trim() || verificationCode.trim().length < 4;
  }, [verificationCode, loading]);

  const passwordHint =
    signupPassword && signupPassword.length < 5 ? 'Use at least 5 characters.' : '';

  const isSignupDisabled = useMemo(() => {
    if (loading) return true;
    const nameValid = name.trim().length >= 2;
    const emailValid = email.trim().length > 0 && email.includes('@');
    const passwordValid = signupPassword.length >= 5;
    return !nameValid || !emailValid || !passwordValid;
  }, [name, email, signupPassword, loading]);

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
        setError(formatLoginError(data, 'Invalid or expired code. Try again or request a new one.'));
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
      console.error('[Auth] Verify error', err);
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

  async function onLoginSubmit(e) {
    e.preventDefault();
    if (isLoginDisabled) return;
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
      const loginPayload = { password };
      if (isEmail) loginPayload.email = trimmedIdentifier;
      else loginPayload.username = trimmedIdentifier;
      if (recaptchaToken) loginPayload.recaptchaToken = recaptchaToken;
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(loginPayload),
      });
      const text = await res.text();
      let data = {};
      if (text && text.trim()) {
        try {
          data = JSON.parse(text);
        } catch {
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
      if (!res.ok || !data.success) {
        if (res.status === 403 && data.needs_verification && data.email) {
          setPendingEmail(data.email);
          setNeedsVerification(true);
          setError('');
          setLoading(false);
          return;
        }
        setError(formatLoginError(data, "We couldn't sign you in with those credentials."));
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
      console.error('[Auth] Login error', err);
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        setError('Unable to connect to the server. Please check your internet connection and try again.');
      } else {
        setError(err.message || "We couldn't sign you in. Please check your credentials and try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function onSignupSubmit(e) {
    e.preventDefault();
    if (isSignupDisabled) return;
    setLoading(true);
    setError('');
    const recaptchaToken = recaptchaAvailable ? await executeRecaptcha() : null;
    if (recaptchaAvailable && !recaptchaToken) {
      setError('Security verification failed. Please refresh and try again.');
      setLoading(false);
      return;
    }
    try {
      const payload = { name: name.trim(), email: email.trim(), password: signupPassword };
      if (recaptchaToken) payload.recaptchaToken = recaptchaToken;
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      const text = await res.text();
      let data = {};
      if (text && text.trim()) {
        try {
          data = JSON.parse(text);
        } catch {
          if (res.status >= 500) {
            setError('Server error. Please try again in a moment.');
          } else if (res.status === 0 || !res.ok) {
            setError('Unable to connect to the server. Please check your internet connection.');
          } else {
            setError("We couldn't create your account. Please try again.");
          }
          setLoading(false);
          return;
        }
      }
      if (!res.ok || !data.success) {
        setError(formatSignupError(data, "We couldn't create your account. Please try again."));
        setLoading(false);
        return;
      }
      if (data.data && (data.data.requiresVerification || data.data.message)) {
        const targetEmail = data.data.email || email;
        router.push(`/verify-email?email=${encodeURIComponent(targetEmail)}`);
        return;
      }
      if (data.data && data.data.token) {
        localStorage.setItem('token', data.data.token);
      }
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('auth_redirect_count');
        sessionStorage.removeItem('auth_redirect_time');
      }
      if (data.data && data.data.user) {
        router.replace('/dashboard').then(() => {
          if (typeof window !== 'undefined') {
            window.location.hash = 'overview';
          }
        });
      }
    } catch (err) {
      console.error('[Auth] Signup error', err);
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        setError('Unable to connect to the server. Please check your internet connection and try again.');
      } else {
        setError(err.message || "We couldn't create your account. Please check your connection and try again.");
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

  const tabBtn = (active) =>
    `flex-1 py-2.5 px-3 text-sm font-semibold rounded-lg transition-all ${
      active ? 'bg-white text-teal-800 shadow-sm' : 'text-stone-600 hover:text-stone-900'
    }`;

  return (
    <div className="auth-page min-h-screen flex flex-col bg-[#faf8f5]">
      <Navbar />
      <div className="auth-shell flex-1 flex items-center justify-center px-4 pt-24 pb-16 sm:pt-32 sm:pb-20 bg-gradient-to-b from-teal-50/80 via-[#faf8f5] to-teal-50/50">
        <div className="auth-card w-full max-w-[440px] p-6 sm:p-8 rounded-2xl bg-white/95 backdrop-blur-sm shadow-xl shadow-stone-200/50 border border-stone-200/80 flex flex-col gap-5">
          <div className="flex rounded-xl bg-stone-100 p-1 gap-1" role="tablist" aria-label="Account">
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'login'}
              className={tabBtn(mode === 'login')}
              onClick={() => switchMode('login')}
            >
              Sign in
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'signup'}
              className={tabBtn(mode === 'signup')}
              onClick={() => switchMode('signup')}
            >
              Create account
            </button>
          </div>

          <header className="card-header">
            <h1 className="text-2xl font-bold text-stone-900 mb-1">
              {needsVerification
                ? 'Verify your email'
                : mode === 'login'
                  ? 'Welcome back'
                  : 'Create your account'}
            </h1>
          </header>

          {error && (
            <div
              className={`rounded-xl py-3 px-4 font-medium border ${
                error.startsWith('✓')
                  ? 'bg-teal-50 text-teal-800 border-teal-200'
                  : 'bg-red-50 text-red-700 border-red-200'
              }`}
              role="alert"
              aria-live="assertive"
            >
              {error}
            </div>
          )}

          {mode === 'login' && needsVerification ? (
            <>
              <p className="text-stone-600 text-[0.95rem] leading-relaxed mb-2">
                We&apos;ve sent a verification code to <strong className="text-stone-900">{pendingEmail}</strong>.
                Enter it below to sign in.
              </p>
              <form onSubmit={onVerifySubmit} className="grid gap-5 w-full" noValidate>
                <label className="grid gap-2">
                  <span className="font-semibold text-stone-800 text-sm">Verification Code</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    id="auth-verify-code"
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
                  {loading && (
                    <span
                      className="spinner w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"
                      aria-hidden="true"
                    />
                  )}
                  <span>{loading ? 'Verifying…' : 'Verify & Sign In'}</span>
                </button>
              </form>
              <button
                type="button"
                className="mt-1 text-[0.95rem] font-semibold text-teal-600 hover:underline disabled:opacity-70"
                onClick={backToSignIn}
                disabled={loading}
              >
                ← Back to sign in
              </button>
            </>
          ) : mode === 'login' ? (
            <form onSubmit={onLoginSubmit} className="grid gap-5 w-full" noValidate>
              <label className="grid gap-2">
                <span className="font-semibold text-stone-800 text-sm">Email or Username</span>
                <input
                  type="text"
                  inputMode="text"
                  autoComplete="username email"
                  id="auth-login-identifier"
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
                    id="auth-login-password"
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
                disabled={isLoginDisabled}
                className="w-full flex items-center justify-center gap-2 py-3 px-5 rounded-xl font-semibold text-white bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 disabled:opacity-70 transition-all shadow-lg shadow-teal-500/25"
              >
                {loading && (
                  <span
                    className="spinner w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"
                    aria-hidden="true"
                  />
                )}
                <span>{loading ? 'Signing you in…' : 'Sign In'}</span>
              </button>
            </form>
          ) : (
            <form onSubmit={onSignupSubmit} className="grid gap-5 w-full" noValidate>
              <label className="grid gap-2">
                <span className="font-semibold text-stone-800 text-sm">Full name</span>
                <input
                  type="text"
                  autoComplete="name"
                  id="auth-signup-name"
                  name="name"
                  placeholder="Alex Johnson"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={loading}
                  className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
                />
              </label>
              <label className="grid gap-2">
                <span className="font-semibold text-stone-800 text-sm">Email</span>
                <input
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  id="auth-signup-email"
                  name="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
                />
              </label>
              <label className="grid gap-2">
                <span className="font-semibold text-stone-800 text-sm">Password</span>
                <div className="flex rounded-xl border border-stone-200 bg-white focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-500/20 overflow-hidden">
                  <input
                    type={showSignupPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    id="auth-signup-password"
                    name="password"
                    placeholder="Create a secure password"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    required
                    minLength={5}
                    disabled={loading}
                    className="flex-1 min-w-0 py-3 px-4 border-0 bg-transparent outline-none"
                  />
                  <span className="flex items-center pr-2">
                    <button
                      type="button"
                      onClick={() => setShowSignupPassword((p) => !p)}
                      tabIndex={-1}
                      aria-label={showSignupPassword ? 'Hide password' : 'Show password'}
                      disabled={loading}
                      className="p-2 text-stone-500 hover:text-stone-700 rounded-lg"
                    >
                      {showSignupPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </span>
                </div>
                {passwordHint && <small className="text-stone-500 text-xs">{passwordHint}</small>}
              </label>
              <button
                type="submit"
                disabled={isSignupDisabled}
                className="w-full flex items-center justify-center gap-2 py-3 px-5 rounded-xl font-semibold text-white bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 disabled:opacity-70 transition-all shadow-lg shadow-teal-500/25"
              >
                {loading && (
                  <span
                    className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"
                    aria-hidden="true"
                  />
                )}
                <span>{loading ? 'Creating your space…' : 'Create Account'}</span>
              </button>
            </form>
          )}

          <p className="text-center text-sm text-stone-500">
            <Link href="/" className="text-teal-600 hover:underline">
              DMS Control — manage DNS for all your devices
            </Link>
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
