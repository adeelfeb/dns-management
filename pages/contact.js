import Head from 'next/head';
import Navbar from '../components/designndev/Navbar';
import Footer from '../components/designndev/Footer';
import ContactForm from '../components/designndev/ContactForm';

export default function ContactPage() {
  return (
    <>
      <Head>
        <title>Contact | DNS Control</title>
        <meta 
          name="description" 
          content="Get in touch with DNS Control. Questions, feedback, or support about DNS management." 
        />
        <meta 
          name="keywords" 
          content="DNS Control, contact, feedback, support" 
        />
        <meta property="og:title" content="Contact | DNS Control" />
        <meta 
          property="og:description" 
          content="Get in touch with DNS Control." 
        />
        <meta property="og:type" content="website" />
      </Head>
      <div className="min-h-screen bg-[#faf8f5]">
        <Navbar />
        <main className="pt-24 pb-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10 sm:mb-12">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-stone-900 mb-4">
                Contact Us
              </h1>
              <p className="text-base sm:text-xl text-stone-600 max-w-2xl mx-auto px-1">
                Have questions or feedback about DNS Control? Get in touch.
              </p>
            </div>

            <div className="max-w-4xl mx-auto space-y-12">
              <ContactForm showHeading={false} />

              <div className="bg-gradient-to-br from-stone-50 to-white rounded-2xl p-6 sm:p-8 md:p-12 shadow-lg shadow-stone-200/50 border border-stone-200/80 w-full min-w-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                  <div className="text-center md:text-left">
                    <h3 className="text-lg sm:text-xl font-bold text-stone-900 mb-4">Why DNS Control?</h3>
                    <ul className="space-y-3 text-stone-600 text-sm sm:text-base">
                      <li>Simple DNS management</li>
                      <li>Secure and reliable</li>
                      <li>Easy-to-use dashboard</li>
                      <li>Transparent privacy</li>
                    </ul>
                  </div>

                  <div className="text-center md:text-left">
                    <h3 className="text-lg sm:text-xl font-bold text-stone-900 mb-4">We Can Help</h3>
                    <ul className="space-y-3 text-stone-600 text-sm sm:text-base">
                      <li>Account and login support</li>
                      <li>Feature requests</li>
                      <li>Technical questions</li>
                      <li>Privacy and data</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}

