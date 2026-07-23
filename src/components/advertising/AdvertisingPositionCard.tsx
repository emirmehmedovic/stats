import { MapPin, Maximize2, CheckCircle, XCircle } from 'lucide-react';
import type { AdvertisingPosition } from './types';

interface AdvertisingPositionCardProps {
  position: AdvertisingPosition;
}

export function AdvertisingPositionCard({ position }: AdvertisingPositionCardProps) {
  return (
    <div className="group bg-white rounded-2xl lg:rounded-3xl border-4 border-white overflow-hidden hover:shadow-soft-lg transition-all duration-300 relative shadow-soft">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-50/40 via-white/70 to-blue-50/40 opacity-0 group-hover:opacity-100 transition-opacity" />

      {/* Image */}
      <div className="relative h-44 sm:h-48 lg:h-52 bg-gradient-to-br from-primary-50 to-blue-50">
        {/* Placeholder */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-3 rounded-2xl bg-white shadow-soft flex items-center justify-center">
              <Maximize2 className="w-7 h-7 sm:w-8 sm:h-8 text-primary-400" />
            </div>
            <span className="text-[10px] sm:text-xs text-dark-400 font-medium">Fotografija pozicije</span>
          </div>
        </div>

        {/* Availability badge */}
        <div className="absolute top-3 sm:top-4 right-3 sm:right-4">
          {position.available ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 bg-white text-green-700 text-[10px] sm:text-xs font-semibold rounded-full shadow-soft border border-green-100">
              <CheckCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              Dostupno
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 bg-white text-red-600 text-[10px] sm:text-xs font-semibold rounded-full shadow-soft border border-red-100">
              <XCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              Zauzeto
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 p-4 sm:p-5 lg:p-6">
        {/* Title */}
        <h3 className="text-base sm:text-lg font-bold text-dark-900 mb-2">
          {position.title}
        </h3>

        {/* Description */}
        <p className="text-xs sm:text-sm text-dark-500 mb-4 sm:mb-5 line-clamp-2">
          {position.description}
        </p>

        {/* Meta info */}
        <div className="space-y-2 sm:space-y-2.5 mb-4 sm:mb-5">
          <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
              <Maximize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary-600" />
            </div>
            <span className="text-dark-600">
              Dimenzije: <span className="font-medium text-dark-900">{position.dimensions}</span>
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary-600" />
            </div>
            <span className="text-dark-600">{position.location}</span>
          </div>
        </div>

        {/* CTA */}
        <a
          href="#kontakt"
          className={`
            block w-full text-center py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all
            ${position.available
              ? 'bg-primary-600 text-white hover:bg-primary-700 shadow-soft'
              : 'bg-dark-100 text-dark-400 cursor-not-allowed'
            }
          `}
        >
          {position.available ? 'Zatražite ponudu' : 'Trenutno nedostupno'}
        </a>
      </div>
    </div>
  );
}
