'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import LocaleSwitcher from '../../components/LocaleSwitcher';

function AccordionItem({ step, index, isOpen, onToggle }) {
  return (
    <div className="border border-primary-100 rounded-xl bg-white/95 overflow-hidden shadow-soft hover:shadow-soft-teal hover:border-primary-200 transition-all duration-200">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left font-medium text-stone-900 hover:bg-primary-50/50 transition-colors"
        aria-expanded={isOpen}
        aria-controls={`how-step-${index}`}
        id={`how-step-heading-${index}`}
      >
        <span className="flex items-center gap-3">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 text-primary-700 text-sm font-semibold shrink-0 shadow-sm">
            {index + 1}
          </span>
          {step.title}
        </span>
        <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-stone-100 text-stone-600" aria-hidden>
          {isOpen ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          )}
        </span>
      </button>
      <div
        id={`how-step-${index}`}
        role="region"
        aria-labelledby={`how-step-heading-${index}`}
        className={`grid transition-[grid-template-rows] duration-200 ease-out ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
      >
        <div className="overflow-hidden">
          <div className="px-5 pb-5 pt-0">
            <p className="text-stone-600 text-[15px] leading-relaxed pl-11">{step.details}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const t = useTranslations('landing');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const [openStep, setOpenStep] = useState(null);

  const howSteps = [1, 2, 3, 4].map((i) => ({
    title: t(`howItWorks.steps.${i}.title`),
    details: t(`howItWorks.steps.${i}.details`),
  }));

  const localePrefix = `/${locale}`;
  const howItWorksHash = `${localePrefix}#how-it-works`;

  return (
    <main className="min-h-screen relative bg-surface-warm text-stone-900 texture-overlay">
      {/* Layered gradient texture for depth */}
      <div className="fixed inset-0 pointer-events-none z-0 bg-texture-mesh bg-no-repeat bg-[length:100%_100%]" aria-hidden />
      <div className="fixed inset-0 pointer-events-none z-0 bg-gradient-to-b from-stone-50/80 via-transparent to-stone-100/60" aria-hidden />

      <header className="page-header sticky top-0 z-50 border-b border-stone-200/90 bg-white/90 backdrop-blur-md shadow-soft">
        <div className="container mx-auto px-4 py-4 sm:py-5 flex items-center justify-between max-w-5xl relative z-10">
          <Link href={localePrefix} className="text-xl font-semibold text-stone-900 tracking-tight hover:text-primary-600 transition-colors">
            {tCommon('siteName')}
          </Link>
          <nav className="flex items-center gap-5 sm:gap-6">
            <Link href={howItWorksHash} className="text-stone-600 hover:text-primary-600 text-[15px] font-medium transition-colors">
              {tCommon('nav.howItWorks')}
            </Link>
            <Link href="/login" className="text-stone-600 hover:text-primary-600 text-[15px] font-medium transition-colors">
              {tCommon('nav.logIn')}
            </Link>
            <Link href="/signup" className="nav-button rounded-full px-5 py-2.5 text-[15px] font-semibold">
              {tCommon('nav.signUp')}
            </Link>
            <LocaleSwitcher />
          </nav>
        </div>
      </header>

      <section className="container mx-auto px-4 py-20 sm:py-24 max-w-5xl text-center relative z-10 bg-hero-glow bg-no-repeat bg-[length:120%_120%] bg-[position:50%_-10%]">
        <h1 className="text-4xl sm:text-5xl font-bold text-stone-900 mb-5 tracking-tight">
          {t('hero.title')}
        </h1>
        <p className="text-xl text-stone-600 mb-10 max-w-2xl mx-auto leading-relaxed">
          {t('hero.subtitle')}
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href="/signup"
            className="rounded-full bg-gradient-to-r from-primary-500 to-primary-600 px-6 py-3 text-white font-semibold hover:from-primary-600 hover:to-primary-700 shadow-soft-teal hover:shadow-lg hover:shadow-primary-500/25 transition-all duration-200"
          >
            {t('hero.getStarted')}
          </Link>
          <Link
            href="/login"
            className="rounded-full border-2 border-stone-200 px-6 py-3 font-semibold text-stone-700 hover:bg-stone-50 hover:border-primary-200 hover:text-primary-700 transition-colors duration-200"
          >
            {t('hero.logIn')}
          </Link>
        </div>
      </section>

      <section className="container mx-auto px-4 py-14 sm:py-16 max-w-5xl relative z-10">
        <h2 className="text-2xl font-semibold text-stone-900 mb-4">{t('whatIsDns.heading')}</h2>
        <p className="text-stone-600 max-w-3xl leading-relaxed">
          {t('whatIsDns.paragraph')}
        </p>
        <p className="mt-5">
          <Link href={howItWorksHash} className="text-primary-600 hover:text-primary-700 font-medium hover:underline underline-offset-2 transition-colors">
            {t('whatIsDns.learnMore')}
          </Link>
        </p>
      </section>

      <section id="how-it-works" className="container mx-auto px-4 py-14 sm:py-16 max-w-3xl border-t border-stone-200/80 relative z-10">
        <h2 className="text-3xl font-bold text-stone-900 mb-2">{t('howItWorks.heading')}</h2>
        <p className="text-stone-600 mb-8">{t('howItWorks.intro')}</p>
        <div className="space-y-3">
          {howSteps.map((step, index) => (
            <AccordionItem
              key={index}
              step={step}
              index={index}
              isOpen={openStep === index}
              onToggle={() => setOpenStep(openStep === index ? null : index)}
            />
          ))}
        </div>
        <div className="mt-8 p-5 sm:p-6 bg-primary-50/70 rounded-xl text-sm text-stone-600 border border-primary-100 shadow-soft">
          <p className="font-semibold text-stone-700 mb-2">{t('howItWorks.flowTitle')}</p>
          <p className="leading-relaxed">{t('howItWorks.flowDetail')}</p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-14 sm:py-16 max-w-5xl border-t border-stone-200/80 relative z-10">
        <h2 className="text-2xl font-bold text-stone-900 mb-6">{t('twoWays.heading')}</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-6 border border-primary-100 rounded-xl bg-white/90 shadow-soft hover:shadow-soft-teal hover:border-primary-200 transition-all duration-200">
            <h3 className="text-lg font-semibold text-stone-900 mb-2">{t('twoWays.browserExtension.title')}</h3>
            <p className="text-stone-600 text-[15px] leading-relaxed mb-4">
              {t('twoWays.browserExtension.description')}
            </p>
            <Link href="/dashboard" className="text-primary-600 hover:text-primary-700 font-medium text-sm inline-flex items-center gap-1 hover:underline underline-offset-2 transition-colors">
              {t('twoWays.browserExtension.cta')}
            </Link>
          </div>
          <div className="p-6 border border-accent-100 rounded-xl bg-white/90 shadow-soft hover:shadow-soft-violet hover:border-accent-200 transition-all duration-200">
            <h3 className="text-lg font-semibold text-stone-900 mb-2">{t('twoWays.setupFile.title')}</h3>
            <p className="text-stone-600 text-[15px] leading-relaxed mb-4">
              {t('twoWays.setupFile.description')}
            </p>
            <Link href="/dashboard" className="text-accent-600 hover:text-accent-700 font-medium text-sm inline-flex items-center gap-1 hover:underline underline-offset-2 transition-colors">
              {t('twoWays.setupFile.cta')}
            </Link>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-14 sm:py-16 max-w-5xl border-t border-stone-200/80 text-center relative z-10">
        <p className="text-stone-600 mb-6 text-lg">{t('cta.tagline')}</p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href="/signup"
            className="rounded-full bg-gradient-to-r from-primary-500 to-primary-600 px-6 py-3 text-white font-semibold hover:from-primary-600 hover:to-primary-700 shadow-soft-teal hover:shadow-lg hover:shadow-primary-500/25 transition-all duration-200"
          >
            {t('cta.signUp')}
          </Link>
          <Link
            href="/login"
            className="rounded-full border-2 border-stone-200 px-6 py-3 font-semibold text-stone-700 hover:bg-stone-50 hover:border-primary-200 hover:text-primary-700 transition-colors duration-200"
          >
            {t('cta.logIn')}
          </Link>
        </div>
      </section>

      <footer className="border-t border-stone-200 bg-white/80 backdrop-blur-sm mt-16 relative z-10">
        <div className="container mx-auto px-4 py-8 max-w-5xl flex flex-wrap justify-between items-center gap-4">
          <span className="text-stone-500 text-sm font-medium">{tCommon('footer.siteName')}</span>
          <nav className="flex gap-6 text-sm">
            <Link href="/login" className="text-stone-500 hover:text-primary-600 transition-colors">{tCommon('nav.login')}</Link>
            <Link href="/signup" className="text-stone-500 hover:text-primary-600 transition-colors">{tCommon('nav.signUp')}</Link>
            <Link href="/dashboard" className="text-stone-500 hover:text-primary-600 transition-colors">{tCommon('nav.dashboard')}</Link>
            <Link href="/privacy-policy" className="text-stone-500 hover:text-primary-600 transition-colors">{tCommon('nav.privacy')}</Link>
          </nav>
        </div>
      </footer>
    </main>
  );
}
