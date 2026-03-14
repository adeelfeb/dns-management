import '../styles/globals.css';
import Head from 'next/head';
import { ToastProvider } from '../components/ToastProvider';
import ErrorBoundary from '../components/ErrorBoundary';
import RecaptchaPreloader from '../components/RecaptchaPreloader';

export default function App({ Component, pageProps }) {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <Head>
          <title>Design n Dev</title>
          <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
          <link rel="alternate icon" href="/favicon.svg" />
          <link rel="apple-touch-icon" href="/favicon.svg" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="preconnect" href="https://www.google.com" />
          <link rel="preconnect" href="https://www.gstatic.com" crossOrigin="" />
        </Head>
        <RecaptchaPreloader />
        <Component {...pageProps} />
      </ToastProvider>
    </ErrorBoundary>
  );
}
