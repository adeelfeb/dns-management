import Head from 'next/head';
import Navbar from '../components/designndev/Navbar';
import Footer from '../components/designndev/Footer';
import Link from 'next/link';

export default function PrivacyPolicyPage() {
  return (
    <>
      <Head>
        <title>Privacy Policy | DNS Control</title>
        <meta
          name="description"
          content="Privacy policy for DNS Control. How we handle your data when you use our website."
        />
        <meta name="keywords" content="privacy policy, DNS Control, data protection, website usage" />
        <meta property="og:title" content="Privacy Policy | DNS Control" />
        <meta property="og:type" content="website" />
      </Head>
      <div className="min-h-screen bg-[#faf8f5]">
        <Navbar />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 pt-24">
          <h1 className="text-3xl md:text-4xl font-bold text-stone-900 mb-2">Privacy Policy</h1>
          <p className="text-stone-500 text-sm mb-10">Last updated: February 2025</p>

          <div className="prose prose-stone max-w-none space-y-10 text-stone-700">
            <section>
              <h2 className="text-xl font-semibold text-stone-900 mb-3">1. Introduction</h2>
              <p>
                This Privacy Policy describes how DNS Control (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) handles information in connection with your use of this website. By using our site, you agree to the practices described here. This policy applies to all services offered on this website, including: browsing the home page; using the contact form; and using the dashboard when you have an account.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-stone-900 mb-3">2. Utilization of This Website</h2>
              <p className="mb-3">
                Our website provides the following services and features:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li><strong>General browsing:</strong> Home and Contact pages can be visited without creating an account. We do not track or store your personal information for these pages beyond what is technically necessary (e.g., server logs).</li>
                <li><strong>Account & dashboard:</strong> To use the dashboard, you may sign up and log in. We store only what is needed (e.g., email, account-related data).</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-stone-900 mb-3">3. Information We Collect and Use</h2>
              <p>
                We collect minimal information necessary to operate the services you use: account credentials and profile information when you register; content you submit (contact form); and technical data such as IP address or browser type where required for security or operation. We do not sell your personal information. We use this information only to provide, maintain, and improve our website and services.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-stone-900 mb-3">4. Cookies and Similar Technologies</h2>
              <p>
                We may use cookies or similar technologies for essential site operation (e.g., keeping you logged in, preferences). We do not use cookies for third-party advertising or tracking beyond what is needed for the website to function.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-stone-900 mb-3">5. Data Security and Retention</h2>
              <p>
                We take reasonable measures to protect your data. Your account information is stored securely and is not shared with third parties for marketing. We retain data only as long as necessary to provide the services or as required by law.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-stone-900 mb-3">6. Your Rights</h2>
              <p>
                You may request access to, correction of, or deletion of your personal data where applicable. For account-related requests, use the contact form or the options in your dashboard where available.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-stone-900 mb-3">7. Contact</h2>
              <p>
                For questions about this Privacy Policy or your data, use our <Link href="/contact" className="text-teal-600 hover:underline font-medium">Contact</Link> page.
              </p>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-stone-200">
            <Link href="/" className="text-teal-600 hover:underline font-medium">
              ← Back to Home
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}
