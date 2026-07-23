import { Plane } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-dark-100 py-8 sm:py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:justify-between sm:text-left">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center shadow-soft">
              <Plane className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-dark-900">Međunarodni aerodrom Tuzla</p>
              <p className="text-xs text-dark-500">Oglašavanje</p>
            </div>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6 text-xs sm:text-sm">
            <a
              href="https://tuzla-airport.ba"
              target="_blank"
              rel="noopener noreferrer"
              className="text-dark-500 hover:text-primary-600 transition-colors font-medium"
            >
              Službena stranica
            </a>
            <a
              href="#"
              className="text-dark-500 hover:text-primary-600 transition-colors font-medium"
            >
              Politika privatnosti
            </a>
          </div>

          {/* Copyright */}
          <p className="text-xs text-dark-400">
            © {currentYear} Aerodrom Tuzla
          </p>
        </div>
      </div>
    </footer>
  );
}
