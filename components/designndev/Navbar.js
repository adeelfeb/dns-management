'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

function useRouterCompat() {
  const [pathname, setPathname] = useState('')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPathname(window.location.pathname)
      const handleRouteChange = () => setPathname(window.location.pathname)
      window.addEventListener('popstate', handleRouteChange)
      const op = history.pushState
      const or = history.replaceState
      history.pushState = function (...args) {
        op.apply(history, args)
        handleRouteChange()
      }
      history.replaceState = function (...args) {
        or.apply(history, args)
        handleRouteChange()
      }
      return () => {
        window.removeEventListener('popstate', handleRouteChange)
        history.pushState = op
        history.replaceState = or
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
    const handleScroll = () => setIsScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const isActive = (href) => {
    if (!isMounted || !router.pathname) return false
    if (href === '/') return router.pathname === '/' || /^\/(en|nl)\/?$/.test(router.pathname)
    return router.pathname.startsWith(href)
  }

  const navItems = [
    { href: '/', label: 'Home' },
    { href: '/privacy-policy', label: 'Privacy Policy' },
    { href: '/login', label: 'Log in' },
    { href: '/signup', label: 'Sign up' },
  ]

  const barClass = isScrolled
    ? 'bg-white/95 backdrop-blur-md shadow-md border border-stone-200/80'
    : 'bg-white/90 backdrop-blur-sm border border-stone-200/60'

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
    >
      <div className="max-w-5xl mx-auto px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5">
        <div className={`flex items-center justify-between gap-4 rounded-xl px-3 sm:px-4 lg:px-5 py-2.5 min-h-[48px] sm:min-h-[52px] transition-all duration-300 ${barClass}`}>
          <Link
            href="/"
            className="text-lg sm:text-xl font-semibold text-stone-900 tracking-tight no-underline hover:text-teal-600 transition-colors"
          >
            DNS Control
          </Link>

          <div className="hidden md:flex flex-1 justify-center min-w-0">
            <div className="flex items-center gap-1 sm:gap-2 lg:gap-4">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200 no-underline ${
                    isActive(item.href)
                      ? 'text-teal-600 bg-teal-50'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            <div className="hidden md:flex items-center gap-1.5 sm:gap-2">
              <Link
                href="/login"
                className="inline-flex items-center justify-center h-8 sm:h-9 px-3 sm:px-4 text-xs sm:text-sm font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg no-underline transition-colors"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center justify-center h-8 sm:h-9 px-3 sm:px-4 text-xs sm:text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg no-underline transition-colors shadow-sm"
              >
                Sign up
              </Link>
            </div>

            <button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors"
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

        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="md:hidden mt-2 overflow-hidden"
            >
              <div className="rounded-xl bg-white border border-stone-200 shadow-lg py-2 px-2">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`block px-3 py-2.5 text-sm font-medium rounded-lg no-underline transition-colors ${
                      isActive(item.href) ? 'text-teal-600 bg-teal-50' : 'text-stone-600 hover:bg-stone-50'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
                <div className="flex gap-2 pt-2 mt-2 border-t border-stone-200 px-2">
                  <Link
                    href="/login"
                    className="flex-1 text-center py-2.5 text-sm font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg no-underline transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Log in
                  </Link>
                  <Link
                    href="/signup"
                    className="flex-1 text-center py-2.5 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg no-underline transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign up
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
