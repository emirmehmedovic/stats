import { Globe, Eye, LayoutGrid } from 'lucide-react';
import type { BenefitItem } from './types';

const iconMap = {
  globe: Globe,
  eye: Eye,
  layout: LayoutGrid,
};

interface BenefitCardProps {
  benefit: BenefitItem;
}

export function BenefitCard({ benefit }: BenefitCardProps) {
  const Icon = iconMap[benefit.icon];

  return (
    <div className="group bg-white rounded-2xl lg:rounded-3xl p-5 sm:p-6 lg:p-8 shadow-soft hover:shadow-soft-lg transition-all duration-300 border-4 border-white relative overflow-hidden min-h-[180px] flex flex-col">
      {/* Background decorations */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-50/60 via-white/70 to-blue-50/50 opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-primary-200 rounded-full blur-2xl opacity-0 group-hover:opacity-50 transition-opacity" />
      <div className="absolute bottom-0 left-0 w-20 h-20 bg-blue-100 rounded-full blur-2xl -mb-8 -ml-8 opacity-0 group-hover:opacity-50 transition-opacity" />

      <div className="relative z-10 flex-1 flex flex-col">
        {/* Icon */}
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-primary-50 border border-primary-100 flex items-center justify-center mb-4 sm:mb-5 group-hover:bg-primary-100 group-hover:scale-110 transition-all">
          <Icon className="w-6 h-6 sm:w-7 sm:h-7 text-primary-600" />
        </div>

        {/* Title */}
        <h3 className="text-base sm:text-lg lg:text-xl font-bold text-dark-900 mb-2 sm:mb-3">
          {benefit.title}
        </h3>

        {/* Description */}
        <p className="text-xs sm:text-sm text-dark-500 leading-relaxed">
          {benefit.description}
        </p>
      </div>
    </div>
  );
}
