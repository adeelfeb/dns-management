'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

// Support both App Router and Pages Router
function useRouterCompat() {
  const [pathname, setPathname] = useState('')
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPathname(window.location.pathname)
      
      const handleRouteChange = () => {
        setPathname(window.location.pathname)
      }
      
      window.addEventListener('popstate', handleRouteChange)
      
      const originalPushState = history.pushState
      const originalReplaceState = history.replaceState
      
      history.pushState = function(...args) {
        originalPushState.apply(history, args)
        handleRouteChange()
      }
      
      history.replaceState = function(...args) {
        originalReplaceState.apply(history, args)
        handleRouteChange()
      }
      
      return () => {
        window.removeEventListener('popstate', handleRouteChange)
        history.pushState = originalPushState
        history.replaceState = originalReplaceState
      }
    }
  }, [])
  
  return { asPath: pathname, pathname }
}

export default function Navbar() {
  const router = useRouterCompat()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const isActive = (href) => {
    if (!isMounted) return false
    const pathname = router.asPath || router.pathname
    if (!pathname) return false
    if (href === '/') {
      return pathname === '/'
    }
    return pathname.startsWith(href)
  }

  const navItems = [
    { href: '/', label: 'Home' },
    { href: '/privacy-policy', label: 'Privacy Policy' },
    { href: '/login', label: 'Log in' },
    { href: '/signup', label: 'Sign up' },
  ]

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5">
        <div className={`flex items-center justify-between gap-4 rounded-xl px-3 sm:px-4 lg:px-5 py-2 sm:py-2.5 min-h-[48px] sm:min-h-[52px] transition-all duration-300 ${
          isScrolled
            ? 'bg-slate-900/95 backdrop-blur-md shadow-lg border border-slate-700/50'
            : 'bg-slate-900/90 backdrop-blur-sm shadow-md border border-slate-800/50'
        }`}>
          {/* Logo */}
          <div className="flex-shrink-0 min-w-0">
            <Link
              href="/"
              className="text-lg sm:text-xl font-bold no-underline hover:opacity-90 active:opacity-80 transition-opacity inline-block tracking-tight"
            >
              <span className="text-orange-500">DNS</span>
              <span className="text-slate-300"> Control</span>
            </Link>
          </div>

          {/* Desktop nav links */}
          <div className="hidden md:flex flex-1 justify-center min-w-0">
            <div className="flex items-center gap-1 sm:gap-2 lg:gap-4">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm font-medium rounded-md transition-all duration-200 no-underline relative ${
                    isActive(item.href)
                      ? 'text-orange-400 bg-orange-500/10'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Right: CTA buttons (desktop) + menu toggle (mobile) */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            <div className="hidden md:flex items-center gap-1.5 sm:gap-2">
              <Link
                href="/login"
                className="inline-flex items-center justify-center h-8 sm:h-9 px-3 sm:px-4 text-xs sm:text-sm font-semibold text-white bg-orange-600 hover:bg-orange-500 active:bg-orange-700 rounded-lg no-underline transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-slate-900"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center justify-center h-8 sm:h-9 px-3 sm:px-4 text-xs sm:text-sm font-semibold text-slate-200 bg-slate-700/80 hover:bg-slate-600 active:bg-slate-600 border border-slate-600 hover:border-slate-500 rounded-lg no-underline transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-slate-900"
              >
                Sign Up
              </Link>
            </div>

            <button
              type="button"
              onClick={toggleMenu}
              className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700/50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-colors"
              aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMenuOpen}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="md:hidden mt-2 overflow-hidden"
            >
              <div className="rounded-xl bg-slate-900/95 backdrop-blur-md border border-slate-700/50 shadow-xl py-2 px-2">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`block px-3 py-2.5 text-sm font-medium rounded-lg no-underline transition-colors ${
                      isActive(item.href)
                        ? 'text-orange-400 bg-orange-500/10'
                        : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
                <div className="flex gap-2 pt-2 mt-2 border-t border-slate-700/50 px-2">
                  <Link
                    href="/login"
                    className="flex-1 text-center py-2.5 text-sm font-semibold text-white bg-orange-600 hover:bg-orange-500 rounded-lg no-underline transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    href="/signup"
                    className="flex-1 text-center py-2.5 text-sm font-semibold text-slate-200 bg-slate-700 hover:bg-slate-600 rounded-lg no-underline transition-colors border border-slate-600"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign Up
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  )
}
