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
  
  // Always use the message from the API if available
  // Don't expose error details to users
  if (payload.message) {
    return payload.message;
  }
  
  return fallback;
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
    console.warn('[Signup] Redirect loop detected, clearing auth state');
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

export default function SignupPage() {
  const router = useRouter();
  const { execute: executeRecaptcha, isAvailable: recaptchaAvailable } = useRecaptcha();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const hasCheckedAuth = useRef(false);

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
        
        // If no token, skip API call and show signup form immediately
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

        // If request fails, clear localStorage and show signup page
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
          
          // Use router.replace then set hash to avoid Next.js router issues
          router.replace('/dashboard').then(() => {
            if (typeof window !== 'undefined') {
              window.location.hash = 'blogs';
            }
          });
          return;
        } else {
          // Cookie auth failed but localStorage has token - they're out of sync
          // Clear localStorage to prevent redirect loops
          localStorage.removeItem('token');
        }
      } catch (err) {
        // If check fails, clear potentially stale token and show signup page
        console.log('[Signup] Auth check failed, showing signup page:', err);
        localStorage.removeItem('token');
      } finally {
        setCheckingAuth(false);
      }
    }

    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady]);

  // Optimized validation - check immediately on input change
  const passwordHint = password && password.length < 5 ? 'Use at least 5 characters.' : '';

  const isDisabled = useMemo(() => {
    if (loading) return true;
    // Fast validation without blocking
    const nameValid = name.trim().length >= 2;
    const emailValid = email.trim().length > 0 && email.includes('@');
    const passwordValid = password.length >= 5;
    return !nameValid || !emailValid || !passwordValid;
  }, [name, email, password, loading]);

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
      const payload = { name: name.trim(), email: email.trim(), password };
      if (recaptchaToken) payload.recaptchaToken = recaptchaToken;
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Include cookies for session management
        body: JSON.stringify(payload),
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
            setError("We couldn't create your account. Please try again.");
          }
          setLoading(false);
          return;
        }
      }
      
      // Handle API errors gracefully
      if (!res.ok || !data.success) {
        const errorMessage = formatErrorMessage(data, "We couldn't create your account. Please try again.");
        setError(errorMessage);
        setLoading(false);
        return;
      }
      
      // Success - check if email verification is required
      if (data.data && (data.data.requiresVerification || data.data.message)) {
        // Redirect to verification page with email
        const targetEmail = data.data.email || email;
        router.push(`/verify-email?email=${encodeURIComponent(targetEmail)}`);
        return;
      }
      
      // Store token in localStorage for API requests (if provided)
      if (data.data && data.data.token) {
        localStorage.setItem('token', data.data.token);
      }
      
      // Clear redirect loop counter on successful signup
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('auth_redirect_count');
        sessionStorage.removeItem('auth_redirect_time');
      }
      
      // Redirect immediately if user is fully authenticated - cookies are set synchronously
      if (data.data && data.data.user) {
        // Use router.replace then set hash to avoid Next.js router issues
        router.replace('/dashboard').then(() => {
          if (typeof window !== 'undefined') {
            window.location.hash = 'blogs';
          }
        });
      }
    } catch (err) {
      // Catch any unexpected errors (network errors, etc.)
      console.error('[Signup] Error during signup flow', err);
      
      // Handle network errors
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        setError('Unable to connect to the server. Please check your internet connection and try again.');
      } else {
        setError(err.message || "We couldn't create your account. Please check your connection and try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  // Show skeleton loading state while checking authentication
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
    <div className="min-h-screen flex flex-col bg-[#faf8f5]">
      <Navbar />
      <div className="flex-1 flex items-center justify-center px-4 pt-24 pb-16 sm:pt-32 sm:pb-20 bg-gradient-to-b from-teal-50/80 via-[#faf8f5] to-teal-50/50">
        <div className="w-full max-w-[440px] p-6 sm:p-8 rounded-2xl bg-white/95 backdrop-blur-sm shadow-xl shadow-stone-200/50 border border-stone-200/80 flex flex-col gap-6">
          <header>
            <h1 className="text-2xl font-bold text-stone-900 mb-1">Create your account</h1>
          </header>

          {error && (
            <div
              className={`rounded-xl py-3 px-4 font-medium border ${
                error.startsWith('✓') ? 'bg-teal-50 text-teal-800 border-teal-200' : 'bg-red-50 text-red-700 border-red-200'
              }`}
              role="alert"
              aria-live="assertive"
            >
              {error}
            </div>
          )}

          <form onSubmit={onSubmit} className="grid gap-5 w-full" noValidate>
            <label className="grid gap-2">
              <span className="font-semibold text-stone-800 text-sm">Full name</span>
              <input
                type="text"
                autoComplete="name"
                id="signup-name"
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
                id="signup-email"
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
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  id="signup-password"
                  name="password"
                  placeholder="Create a secure password"
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
              {passwordHint && <small className="text-stone-500 text-xs">{passwordHint}</small>}
            </label>
            <button
              type="submit"
              disabled={isDisabled}
              className="w-full flex items-center justify-center gap-2 py-3 px-5 rounded-xl font-semibold text-white bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 disabled:opacity-70 transition-all shadow-lg shadow-teal-500/25"
            >
              {loading && <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" aria-hidden="true" />}
              <span>{loading ? 'Creating your space…' : 'Create Account'}</span>
            </button>
          </form>

          <footer className="flex justify-center gap-2 text-[0.95rem] text-stone-600">
            <span>Already registered?</span>
            <Link href="/login" className="font-semibold text-teal-600 hover:underline">Sign in instead</Link>
          </footer>
          <p className="text-center text-sm text-stone-500 mt-2">
            <Link href="/" className="text-teal-600 hover:underline">Use DNS control on all your devices</Link>. After verifying your email, add devices and choose the extension or setup file.
          </p>
        </div>
      </div>

      <Footer />
    </div>
  );
}

