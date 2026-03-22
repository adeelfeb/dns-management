'use client'

import Link from 'next/link'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-stone-200 bg-white/90 backdrop-blur-sm">
      <section className="py-10 md:py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-base font-semibold text-stone-900 mb-3">DMS Control</h3>
              <p className="text-stone-600 text-sm leading-relaxed">
                Control DNS for your devices. Block or allow websites per device from one dashboard.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-stone-900 mb-3">Quick Links</h4>
              <ul className="space-y-2 text-stone-600 text-sm">
                <li><Link href="/" className="hover:text-teal-600 transition-colors">Home</Link></li>
                <li><Link href="/privacy-policy" className="hover:text-teal-600 transition-colors">Privacy Policy</Link></li>
                <li><Link href="/contact" className="hover:text-teal-600 transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-stone-900 mb-3">Account</h4>
              <ul className="space-y-2 text-stone-600 text-sm">
                <li><Link href="/auth" className="hover:text-teal-600 transition-colors">Sign in</Link></li>
                <li><Link href="/dashboard" className="hover:text-teal-600 transition-colors">Dashboard</Link></li>
              </ul>
            </div>
          </div>
        </div>
      </section>
      <section className="py-4 border-t border-stone-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-stone-500 text-sm">
            © {currentYear} DMS Control. All rights reserved.
          </p>
        </div>
      </section>
    </footer>
  )
}
