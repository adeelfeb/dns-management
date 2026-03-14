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
      <div className="auth-page">
        <Navbar />
        <div className="auth-shell">
          <AuthCardSkeleton />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="auth-page">
      <Navbar />
      <div className="auth-shell">
        <div className="auth-card">
          <header className="card-header">
            <h1>Create your account</h1>
          </header>

          {error && (
            <div 
              className={`alert ${error.startsWith('✓') ? 'alert-success' : ''}`} 
              role="alert" 
              aria-live="assertive"
            >
              {error}
            </div>
          )}

          <form onSubmit={onSubmit} className="form" noValidate>
            <label className="field">
              <span>Full name</span>
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
              />
            </label>
            <label className="field">
              <span>Email</span>
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
              />
            </label>
            <label className="field">
              <span>Password</span>
              <div className="password-wrap">
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
                  className="password-input"
                />
                <span className="password-toggle-wrap">
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword((p) => !p)}
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    disabled={loading}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </span>
              </div>
              {passwordHint && <small className="helper">{passwordHint}</small>}
            </label>
            <button type="submit" disabled={isDisabled}>
              {loading && <span className="spinner" aria-hidden="true" />}
              <span>{loading ? 'Creating your space…' : 'Create Account'}</span>
            </button>
          </form>

          <footer className="card-footer">
            <span>Already registered?</span>
            <Link href="/login" className="cta-link">
              Sign in instead
            </Link>
          </footer>
          <p className="auth-home-link">
            <Link href="/">Use DNS control on all your devices</Link>. After verifying your email, add devices and choose the extension or setup file.
          </p>

        </div>
      </div>

      <style jsx>{`
        .auth-page {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }
        .auth-shell {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 8rem 1.5rem 4rem;
          flex: 1;
          background: radial-gradient(circle at top, rgba(0, 176, 117, 0.12), transparent 55%),
            radial-gradient(circle at bottom, rgba(0, 112, 243, 0.14), transparent 45%);
        }
        .auth-card {
          width: 100%;
          max-width: 440px;
          min-width: 0;
          padding: 2.6rem 2.6rem 2.25rem;
          border-radius: 1.6rem;
          background: rgba(255, 255, 255, 0.95);
          box-shadow: 0 26px 68px rgba(12, 54, 102, 0.16);
          backdrop-filter: blur(8px);
          display: flex;
          flex-direction: column;
          gap: 1.85rem;
          animation: fadeIn 0.45s ease 0.05s both;
        }
        .card-header h1 {
          font-size: 2rem;
          font-weight: 700;
          color: #0f1c2f;
          margin-bottom: 0.5rem;
        }
        .card-header p {
          color: #516276;
          line-height: 1.55;
        }
        .alert {
          border-radius: 0.8rem;
          padding: 0.8rem 1rem;
          background: rgba(220, 38, 38, 0.08);
          color: #b91c1c;
          border: 1px solid rgba(220, 38, 38, 0.22);
          font-weight: 500;
        }
        .alert-success {
          background: rgba(16, 185, 129, 0.08);
          color: #059669;
          border: 1px solid rgba(16, 185, 129, 0.22);
        }
        .alert-success {
          background: rgba(16, 185, 129, 0.08);
          color: #059669;
          border: 1px solid rgba(16, 185, 129, 0.22);
        }
        .form {
          display: grid;
          gap: 1.35rem;
          width: 100%;
          min-width: 0;
        }
        .field {
          display: grid;
          gap: 0.6rem;
          min-width: 0;
        }
        .field span {
          font-weight: 600;
          color: #0f1c2f;
          font-size: 0.94rem;
        }
        input {
          width: 100%;
          min-width: 0;
          max-width: 100%;
          box-sizing: border-box;
          padding: 0.95rem 1rem;
          border-radius: 0.95rem;
          border: 1px solid rgba(13, 48, 89, 0.14);
          background: #fff;
          font-size: 1rem;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }
        input:focus {
          outline: none;
          border-color: rgba(0, 176, 117, 0.55);
          box-shadow: 0 0 0 4px rgba(0, 176, 117, 0.15);
        }
        input:disabled {
          background: #f5f7fb;
        }
        .password-wrap .password-input:disabled {
          background: transparent;
        }
        .password-wrap:has(.password-input:disabled) {
          background: #f5f7fb;
        }
        .password-wrap {
          display: flex;
          align-items: stretch;
          width: 100%;
          min-width: 0;
          border-radius: 0.95rem;
          border: 1px solid rgba(13, 48, 89, 0.14);
          background: #fff;
          overflow: hidden;
        }
        .password-wrap:focus-within {
          border-color: rgba(0, 176, 117, 0.55);
          box-shadow: 0 0 0 4px rgba(0, 176, 117, 0.15);
        }
        .password-wrap .password-input {
          flex: 1;
          min-width: 0;
          width: 0;
          padding: 0.95rem 0 0.95rem 1rem;
          border: none;
          border-radius: 0.95rem 0 0 0.95rem;
          background: transparent;
          font-size: 1rem;
          transition: none;
        }
        .password-wrap .password-input:focus {
          outline: none;
          box-shadow: none;
        }
        .password-wrap .password-input::placeholder {
          color: #9ca3af;
        }
        .password-toggle-wrap {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 0.5rem;
        }
        .password-toggle {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0.4rem;
          background: transparent;
          border: none;
          color: #6b7280;
          cursor: pointer;
          border-radius: 0.5rem;
          transition: color 0.2s ease, background 0.2s ease;
        }
        .password-toggle:hover:not(:disabled) {
          color: #374151;
          background: rgba(13, 48, 89, 0.06);
        }
        .password-toggle:disabled {
          cursor: not-allowed;
          opacity: 0.6;
        }
        .helper {
          font-size: 0.8rem;
          color: #6b7280;
        }
        button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.7rem;
          padding: 1rem 1.3rem;
          border-radius: 1rem;
          border: none;
          background: linear-gradient(135deg, #00a86b, #00c2a8);
          color: #fff;
          font-weight: 600;
          font-size: 1rem;
          cursor: pointer;
          transition: transform 0.18s ease, box-shadow 0.18s ease, opacity 0.18s ease;
        }
        button:not(:disabled):hover {
          transform: translateY(-1px);
          box-shadow: 0 14px 36px rgba(0, 176, 117, 0.28);
        }
        button:disabled {
          cursor: not-allowed;
          opacity: 0.72;
          box-shadow: none;
        }
        .spinner {
          width: 1rem;
          height: 1rem;
          border-radius: 999px;
          border: 2px solid rgba(255, 255, 255, 0.4);
          border-top-color: #fff;
          animation: spin 0.65s linear infinite;
        }
        .card-footer {
          display: flex;
          justify-content: center;
          gap: 0.55rem;
          font-size: 0.96rem;
          color: #516276;
        }
        .cta-link {
          color: #0070f3;
          font-weight: 600;
          text-decoration: none;
        }
        .cta-link:hover {
          text-decoration: underline;
        }
        .auth-home-link {
          margin: 1rem 0 0 0;
          font-size: 0.9rem;
          color: #64748b;
          text-align: center;
        }
        .auth-home-link a {
          color: #2563eb;
          text-decoration: none;
        }
        .auth-home-link a:hover {
          text-decoration: underline;
        }
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @media (max-width: 600px) {
          .auth-shell {
            padding: 6rem 1rem 3rem;
          }
          .auth-card {
            padding: 2.1rem 1.75rem 2rem;
            border-radius: 1.35rem;
          }
          .card-header h1 {
            font-size: 1.75rem;
          }
          .card-header p {
            font-size: 0.9rem;
          }
          .password-wrap .password-input {
            padding: 0.85rem 0 0.85rem 1rem;
          }
          .password-toggle-wrap {
            padding: 0 0.5rem;
          }
        }
        @media (max-width: 480px) {
          .auth-shell {
            padding: 5rem 0.75rem 2.5rem;
          }
          .auth-card {
            padding: 1.85rem 1.25rem 1.75rem;
            gap: 1.5rem;
            margin: 0 0.25rem;
          }
          .card-header h1 {
            font-size: 1.6rem;
          }
          .form {
            gap: 1.15rem;
          }
          input {
            padding: 0.85rem 0.75rem 0.85rem 0.95rem;
            font-size: 16px;
          }
          .password-wrap .password-input {
            padding: 0.85rem 0 0.85rem 0.95rem;
            font-size: 16px;
          }
          .password-toggle-wrap {
            padding: 0 0.4rem;
          }
          button {
            padding: 0.95rem 1.2rem;
            font-size: 0.95rem;
            width: 100%;
          }
        }
        @media (max-width: 380px) {
          .auth-shell {
            padding: 5rem 0.5rem 2rem;
          }
          .auth-card {
            padding: 1.5rem 1rem;
          }
          input {
            padding: 0.75rem 0.65rem 0.75rem 0.85rem;
            font-size: 16px;
          }
          .password-wrap .password-input {
            padding: 0.75rem 0 0.75rem 0.85rem;
            font-size: 16px;
          }
          .password-toggle-wrap {
            padding: 0 0.35rem;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .auth-card {
            animation: none;
          }
          button,
          input {
            transition: none;
          }
          .spinner {
            animation-duration: 1s;
          }
        }
      `}</style>
      <Footer />
    </div>
  );
}

