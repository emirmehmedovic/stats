'use client';

import { Flipboard } from '@/components/advertising/Flipboard';
import { BenefitCard } from '@/components/advertising/BenefitCard';
import { AdvertisingPositionCard } from '@/components/advertising/AdvertisingPositionCard';
import { ContactForm } from '@/components/advertising/ContactForm';
import { Footer } from '@/components/advertising/Footer';
import { PricingSection } from '@/components/advertising/PricingSection';
import { advertisingPositions, processSteps, benefits } from '@/components/advertising/types';
import { Plane, Phone, Mail, MapPin, ArrowRight } from 'lucide-react';

export default function AdvertisingPage() {
  return (
    <div className="min-h-screen bg-dark-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-10 w-96 h-96 bg-primary-200 rounded-full blur-3xl opacity-40" />
          <div className="absolute bottom-20 left-10 w-80 h-80 bg-blue-200 rounded-full blur-3xl opacity-30" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary-100 rounded-full blur-3xl opacity-20" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
          {/* Top bar with logo */}
          <div className="flex items-center justify-between mb-6 sm:mb-8 lg:mb-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary-600 rounded-2xl flex items-center justify-center shadow-soft">
                <Plane className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <p className="text-sm sm:text-base font-bold text-dark-900">Aerodrom Tuzla</p>
                <p className="text-xs sm:text-sm text-dark-500">Oglašavanje</p>
              </div>
            </div>
            <a
              href="#kontakt"
              className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-2xl hover:bg-primary-700 transition-all shadow-soft"
            >
              Kontakt
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          {/* Main content grid */}
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 lg:gap-8">
            {/* Left side - Flipboard (takes more space) */}
            <div className="xl:col-span-3">
              <Flipboard />
            </div>

            {/* Right side - Info card */}
            <div className="xl:col-span-2 flex flex-col gap-6">
              {/* Headline card */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-soft border-4 border-white relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-50/60 via-white/70 to-blue-50/50 opacity-70" />
                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-primary-200 rounded-full blur-2xl opacity-40" />

                <div className="relative z-10">
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary-50 text-primary-600 text-xs font-semibold rounded-full mb-4 border border-primary-100">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    Pozicije dostupne
                  </span>

                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-dark-900 leading-tight mb-4">
                    Vaš brend na mjestu gdje{' '}
                    <span className="text-primary-600">putovanja počinju.</span>
                  </h1>

                  <p className="text-sm sm:text-base text-dark-500 mb-6">
                    Ekskluzivne reklamne pozicije sa visokom vidljivošću za putnike i posjetioce.
                  </p>

                  <a
                    href="#kontakt"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-semibold rounded-2xl hover:bg-primary-700 transition-all shadow-soft text-sm sm:text-base"
                  >
                    Zatražite ponudu
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              </div>

              {/* Stats cards */}
              <div className="grid grid-cols-3 gap-3 sm:gap-4">
                {[
                  { value: '500K+', label: 'Putnika' },
                  { value: '15+', label: 'Destinacija' },
                  { value: '24/7', label: 'Vidljivost' },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="bg-white rounded-2xl p-4 sm:p-5 shadow-soft border-4 border-white text-center relative overflow-hidden group hover:shadow-soft-lg transition-all"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-primary-50/60 via-white/70 to-primary-100/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative z-10">
                      <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-dark-900">{stat.value}</p>
                      <p className="text-[10px] sm:text-xs text-dark-500 mt-1 font-medium">{stat.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="prednosti" className="py-16 sm:py-20 lg:py-28 bg-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-64 h-64 bg-primary-100 rounded-full blur-3xl opacity-30 -ml-32 -mt-32" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-blue-100 rounded-full blur-3xl opacity-30 -mr-40 -mb-40" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-14">
            <span className="inline-block px-4 py-1.5 bg-primary-50 text-primary-600 text-xs sm:text-sm font-semibold rounded-full mb-4 border border-primary-100">
              Zašto mi?
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-dark-900 mb-4">
              Prednosti oglašavanja na aerodromu
            </h2>
            <p className="text-sm sm:text-base lg:text-lg text-dark-500 max-w-2xl mx-auto">
              Dosegnite ciljanu publiku u trenutku kada su najotvoreniji za nove informacije.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {benefits.map((benefit) => (
              <BenefitCard key={benefit.title} benefit={benefit} />
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <PricingSection />

      {/* Positions Section */}
      <section id="pozicije" className="py-16 sm:py-20 lg:py-28 bg-dark-50 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary-100 rounded-full blur-3xl opacity-20" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-14">
            <span className="inline-block px-4 py-1.5 bg-primary-50 text-primary-600 text-xs sm:text-sm font-semibold rounded-full mb-4 border border-primary-100">
              Reklamne pozicije
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-dark-900 mb-4">
              Dostupne lokacije za vaš brend
            </h2>
            <p className="text-sm sm:text-base lg:text-lg text-dark-500 max-w-2xl mx-auto">
              Od velikih zidnih formata do digitalnih ekrana — pronađite idealnu poziciju.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {advertisingPositions.map((position) => (
              <AdvertisingPositionCard key={position.id} position={position} />
            ))}
          </div>

          <div className="text-center mt-8 sm:mt-10">
            <a
              href="#kontakt"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-semibold rounded-2xl hover:bg-primary-700 transition-all shadow-soft text-sm sm:text-base"
            >
              Zatražite sve pozicije
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section id="proces" className="py-16 sm:py-20 lg:py-28 bg-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-100 rounded-full blur-3xl opacity-40" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-100 rounded-full blur-3xl opacity-30" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-14">
            <span className="inline-block px-4 py-1.5 bg-primary-50 text-primary-600 text-xs sm:text-sm font-semibold rounded-full mb-4 border border-primary-100">
              Kako funkcioniše?
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-dark-900 mb-4">
              Od upita do vidljivosti u 4 koraka
            </h2>
            <p className="text-sm sm:text-base lg:text-lg text-dark-500 max-w-2xl mx-auto">
              Jednostavan i transparentan proces za pokretanje vaše kampanje.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {processSteps.map((step) => (
              <div
                key={step.number}
                className="bg-white rounded-2xl lg:rounded-3xl p-5 sm:p-6 shadow-soft border-4 border-white text-center relative overflow-hidden group hover:shadow-soft-lg transition-all"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary-50/60 via-white/70 to-blue-50/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-primary-50 border border-primary-100 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <span className="text-lg sm:text-xl font-bold text-primary-600">{step.number}</span>
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-dark-900 mb-1 sm:mb-2">{step.title}</h3>
                  <p className="text-[11px] sm:text-xs text-dark-500">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="kontakt" className="py-16 sm:py-20 lg:py-28 bg-dark-50 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary-100 rounded-full blur-3xl opacity-30 -ml-48 -mt-48" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-blue-100 rounded-full blur-3xl opacity-30 -mr-40 -mb-40" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-14">
            <span className="inline-block px-4 py-1.5 bg-primary-50 text-primary-600 text-xs sm:text-sm font-semibold rounded-full mb-4 border border-primary-100">
              Kontakt
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-dark-900 mb-4">
              Zainteresirani ste za oglašavanje?
            </h2>
            <p className="text-sm sm:text-base lg:text-lg text-dark-500 max-w-2xl mx-auto">
              Popunite formu i naš tim će vam se javiti sa prilagođenom ponudom.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            {/* Left - Info Card */}
            <div className="bg-white rounded-2xl lg:rounded-3xl p-6 sm:p-8 shadow-soft border-4 border-white relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-50/60 via-white/70 to-blue-50/50 opacity-70" />
              <div className="absolute top-0 right-0 w-48 h-48 bg-primary-200 rounded-full blur-3xl opacity-30 -mr-24 -mt-24" />

              <div className="relative z-10">
                <h3 className="text-lg sm:text-xl font-bold text-dark-900 mb-6">Kontakt informacije</h3>

                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-dark-50 rounded-2xl border border-dark-100">
                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center flex-shrink-0">
                      <Mail className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-dark-500">Email</p>
                      <p className="text-sm sm:text-base text-dark-900 font-medium">marketing@tuzla-airport.ba</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-4 bg-dark-50 rounded-2xl border border-dark-100">
                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center flex-shrink-0">
                      <Phone className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-dark-500">Telefon</p>
                      <p className="text-sm sm:text-base text-dark-900 font-medium">+387 35 814 602</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-4 bg-dark-50 rounded-2xl border border-dark-100">
                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-dark-500">Adresa</p>
                      <p className="text-sm sm:text-base text-dark-900 font-medium">Aerodrom bb, 75270 Živinice</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right - Form Card */}
            <div className="bg-white rounded-2xl lg:rounded-3xl p-6 sm:p-8 shadow-soft border-4 border-white relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-50/40 via-white/70 to-blue-50/40 opacity-70" />
              <div className="absolute top-0 right-0 w-48 h-48 bg-primary-100 rounded-full blur-3xl opacity-30 -mr-24 -mt-24" />

              <div className="relative z-10">
                <ContactForm />
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
