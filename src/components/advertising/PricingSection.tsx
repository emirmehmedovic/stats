'use client';

import { useState } from 'react';
import { Building2, Monitor, Globe, Signpost, ChevronDown, ChevronUp } from 'lucide-react';
import { pricingCategories, type PricingCategory, type PricingItem } from './types';

const iconMap = {
  building: Building2,
  monitor: Monitor,
  globe: Globe,
  signpost: Signpost,
};

function PricingCard({ category }: { category: PricingCategory }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const Icon = iconMap[category.icon];

  // Show first 4 items, or all if expanded
  const displayItems = isExpanded ? category.items : category.items.slice(0, 4);
  const hasMore = category.items.length > 4;

  return (
    <div className="bg-white rounded-2xl lg:rounded-3xl shadow-soft border-4 border-white overflow-hidden relative group hover:shadow-soft-lg transition-all">
      <div className="absolute inset-0 bg-gradient-to-br from-primary-50/40 via-white/70 to-blue-50/40 opacity-0 group-hover:opacity-100 transition-opacity" />

      {/* Header */}
      <div className="relative z-10 p-4 sm:p-5 lg:p-6 border-b border-dark-100">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-primary-50 border border-primary-100 flex items-center justify-center flex-shrink-0">
            <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary-600" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-dark-900">{category.title}</h3>
            <p className="text-xs sm:text-sm text-dark-500 mt-0.5">{category.description}</p>
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="relative z-10">
        {displayItems.map((item, index) => (
          <PricingRow key={item.id} item={item} isLast={index === displayItems.length - 1 && !hasMore} />
        ))}

        {/* Expand/Collapse button */}
        {hasMore && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-center gap-2 py-3 sm:py-4 text-xs sm:text-sm font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 transition-colors border-t border-dark-100"
          >
            {isExpanded ? (
              <>
                Prikaži manje
                <ChevronUp className="w-4 h-4" />
              </>
            ) : (
              <>
                Prikaži sve ({category.items.length} pozicija)
                <ChevronDown className="w-4 h-4" />
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

function PricingRow({ item, isLast }: { item: PricingItem; isLast: boolean }) {
  return (
    <div className={`flex items-center justify-between gap-3 px-4 sm:px-5 lg:px-6 py-3 sm:py-4 ${!isLast ? 'border-b border-dark-50' : ''}`}>
      <div className="flex-1 min-w-0">
        <p className="text-xs sm:text-sm font-medium text-dark-900 truncate">{item.name}</p>
        {item.details && (
          <p className="text-[10px] sm:text-xs text-dark-400 mt-0.5 truncate">{item.details}</p>
        )}
      </div>
      <div className="flex-shrink-0 text-right">
        <p className="text-sm sm:text-base lg:text-lg font-bold text-primary-600">{item.price} KM</p>
        <p className="text-[10px] sm:text-xs text-dark-400">/{item.unit}</p>
      </div>
    </div>
  );
}

export function PricingSection() {
  return (
    <section id="cjenovnik" className="py-16 sm:py-20 lg:py-28 bg-white relative overflow-hidden">
      <div className="absolute top-0 left-0 w-64 h-64 bg-primary-100 rounded-full blur-3xl opacity-30 -ml-32 -mt-32" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-blue-100 rounded-full blur-3xl opacity-30 -mr-40 -mb-40" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 sm:mb-14">
          <span className="inline-block px-4 py-1.5 bg-primary-50 text-primary-600 text-xs sm:text-sm font-semibold rounded-full mb-4 border border-primary-100">
            Cjenovnik
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-dark-900 mb-4">
            Transparentne cijene oglašavanja
          </h2>
          <p className="text-sm sm:text-base lg:text-lg text-dark-500 max-w-2xl mx-auto">
            Sve cijene su izražene u KM bez PDV-a. Kontaktirajte nas za posebne ponude i dugoročne zakupe.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {pricingCategories.map((category) => (
            <PricingCard key={category.id} category={category} />
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-10 sm:mt-14">
          <div className="bg-dark-50 rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10 max-w-3xl mx-auto border-4 border-white shadow-soft">
            <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-dark-900 mb-2 sm:mb-3">
              Trebate prilagođenu ponudu?
            </h3>
            <p className="text-xs sm:text-sm text-dark-500 mb-5 sm:mb-6">
              Za dugoročne zakupe, kombinacije pozicija ili posebne zahtjeve, kontaktirajte nas direktno.
            </p>
            <a
              href="#kontakt"
              className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-primary-600 text-white font-semibold rounded-xl sm:rounded-2xl hover:bg-primary-700 transition-all shadow-soft text-sm sm:text-base"
            >
              Zatražite ponudu
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
