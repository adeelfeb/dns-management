'use client'

import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between max-w-5xl">
          <Link href="/" className="text-xl font-semibold text-slate-900">
            DNS Control
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/#how-it-works" className="text-slate-600 hover:text-slate-900">
              How it works
            </Link>
            <Link href="/login" className="text-slate-600 hover:text-slate-900">
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-blue-600 px-4 py-2 text-white font-medium hover:bg-blue-700"
            >
              Sign up
            </Link>
          </nav>
        </div>
      </header>

      <section className="container mx-auto px-4 py-16 max-w-5xl text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
          Control DNS for your devices
        </h1>
        <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
          Block or allow websites per device. Route your device’s DNS through our server and manage everything from one dashboard.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href="/signup"
            className="rounded-lg bg-blue-600 px-6 py-3 text-white font-medium hover:bg-blue-700"
          >
            Get started
          </Link>
          <Link
            href="/login"
            className="rounded-lg border border-slate-300 px-6 py-3 font-medium text-slate-700 hover:bg-slate-100"
          >
            Log in
          </Link>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12 max-w-5xl">
        <h2 className="text-2xl font-semibold text-slate-900 mb-4">What is DNS control?</h2>
        <p className="text-slate-600 max-w-3xl">
          Your device uses DNS to turn website names (like example.com) into addresses. When you use our DNS, that lookup goes through our server. We can then block or allow specific sites per device—so you decide what is reachable on each phone, tablet, or computer. Your web traffic still goes directly to the internet; only the name resolution is managed by us.
        </p>
        <p className="mt-4">
          <Link href="/#how-it-works" className="text-blue-600 hover:underline">
            Learn how it works →
          </Link>
        </p>
      </section>

      <section id="how-it-works" className="container mx-auto px-4 py-12 max-w-5xl border-t border-slate-200">
        <h2 className="text-2xl font-semibold text-slate-900 mb-6">How it works</h2>
        <ol className="list-decimal list-inside space-y-4 text-slate-600 max-w-2xl">
          <li>Sign up and log in to your dashboard.</li>
          <li>Add a device and get a unique setup link (or install our browser extension).</li>
          <li>Configure your device or browser to use our DNS (one-time setup or extension).</li>
          <li>Manage your block/allow list in the dashboard—per device.</li>
        </ol>
        <div className="mt-8 p-6 bg-slate-100 rounded-lg text-sm text-slate-600">
          <p className="font-medium text-slate-700 mb-2">Flow: Your device → Our DoH server → Check rules → Block or allow → Forward to internet DNS if allowed.</p>
          <p>Blocked domains get no answer (NXDOMAIN); allowed domains are resolved and your browser connects as usual.</p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12 max-w-5xl border-t border-slate-200">
        <h2 className="text-2xl font-semibold text-slate-900 mb-6">Two ways to enable DNS control</h2>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="p-6 border border-slate-200 rounded-lg bg-white">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">1. Browser extension</h3>
            <p className="text-slate-600 text-sm mb-4">
              Install our extension in your browser. One click—no system settings. Filtering applies to that browser only.
            </p>
            <Link href="/dashboard" className="text-blue-600 hover:underline text-sm">
              After sign up, get the extension from the dashboard →
            </Link>
          </div>
          <div className="p-6 border border-slate-200 rounded-lg bg-white">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">2. Download setup file (full device)</h3>
            <p className="text-slate-600 text-sm mb-4">
              Download one file for your platform (Windows, Mac, Linux, iOS, Android). Open or run it—the system configures itself. Whole device uses our DNS.
            </p>
            <Link href="/dashboard" className="text-blue-600 hover:underline text-sm">
              After sign up, add a device and download the setup file →
            </Link>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12 max-w-5xl border-t border-slate-200 text-center">
        <p className="text-slate-600 mb-6">Use DNS control on all your devices.</p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href="/signup"
            className="rounded-lg bg-blue-600 px-6 py-3 text-white font-medium hover:bg-blue-700"
          >
            Sign up
          </Link>
          <Link
            href="/login"
            className="rounded-lg border border-slate-300 px-6 py-3 font-medium text-slate-700 hover:bg-slate-100"
          >
            Log in
          </Link>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white mt-16">
        <div className="container mx-auto px-4 py-8 max-w-5xl flex flex-wrap justify-between items-center gap-4">
          <span className="text-slate-500 text-sm">DNS Control</span>
          <nav className="flex gap-6 text-sm">
            <Link href="/login" className="text-slate-500 hover:text-slate-700">Login</Link>
            <Link href="/signup" className="text-slate-500 hover:text-slate-700">Sign up</Link>
            <Link href="/dashboard" className="text-slate-500 hover:text-slate-700">Dashboard</Link>
            <Link href="/privacy-policy" className="text-slate-500 hover:text-slate-700">Privacy</Link>
          </nav>
        </div>
      </footer>
    </main>
  )
}
