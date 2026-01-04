'use client';

import { useState, FormEvent, lazy, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, User, Eye, EyeOff } from 'lucide-react';

// Lazy load WorldMap komponente za bolju početnu performansu
const WorldMap = lazy(() => import('@/components/ui/world-map').then(mod => ({ default: mod.WorldMap })));

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [rateLimited, setRateLimited] = useState(false);
  const [remainingMinutes, setRemainingMinutes] = useState<number | null>(null);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setRateLimited(false);
    setRemainingMinutes(null);
    setRemainingAttempts(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Check if it's a rate limit error
        if (response.status === 429 && data.rateLimited) {
          setRateLimited(true);
          setRemainingMinutes(data.remainingMinutes || 15);
          setError(data.error || 'Previše neuspješnih pokušaja');
        } else {
          // Regular error
          setError(data.error || 'Neispravni pristupni podaci');
          if (data.remainingAttempts !== undefined) {
            setRemainingAttempts(data.remainingAttempts);
          }
        }
        setIsLoading(false);
        return;
      }

      // Store user info in localStorage for client-side access
      if (data.user) {
        localStorage.setItem('userEmail', data.user.email);
        localStorage.setItem('userName', data.user.name || data.user.email.split('@')[0]);
        localStorage.setItem('userRole', data.user.role);
      }

      // Redirect to dashboard
      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Greška pri prijavljivanju');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-50 flex">
      {/* Left Side - Map Section */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 bg-white p-12 flex-col justify-center relative border-r border-dark-200">
        {/* Content */}
        <div className="w-full h-full flex flex-col">
          {/* Map Visualization - Full Size */}
          <div className="flex-1 bg-white rounded-3xl border border-dark-200 p-8 shadow-soft">
            <div className="w-full h-full">
              <Suspense fallback={
                <div className="w-full h-full flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
                </div>
              }>
                <WorldMap lineColor="#3b82f6" />
              </Suspense>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 xl:w-2/5 flex items-center justify-center p-8 bg-dark-50">
        <div className="w-full max-w-xl">
          {/* Logo */}
          <div className="text-center mb-10">
            <img
              src="/logo-aerodrom.svg"
              alt="Aerodrom Tuzla"
              className="mx-auto"
              width={500}
              height={100}
            />
          </div>

          {/* Login Card - Optimizovano (reduciran blur/hover za performansu) */}
          <div className="bg-white rounded-3xl p-12 shadow-soft-lg relative overflow-hidden border-[6px] border-white" style={{ willChange: 'transform' }}>
            {/* Decorative gradient background - pojednostavljen */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary-50/60 via-white/70 to-primary-100/50 opacity-70"></div>
            <div className="absolute top-0 right-0 -mt-2 -mr-2 w-16 h-16 bg-primary-200 rounded-full blur-xl opacity-60"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary-100 rounded-full blur-xl -mb-12 -ml-12 opacity-60"></div>

            <div className="relative z-10">
              <div className="mb-10">
                <h2 className="text-3xl font-bold text-dark-900 mb-2">Prijava</h2>
                <p className="text-base text-dark-500">Unesite pristupne podatke</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-7">
                {/* Email Input */}
                <div>
                  <label htmlFor="email" className="block text-base font-semibold text-dark-700 mb-3">
                    Email adresa
                  </label>
                  <div className="relative">
                    <User className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-dark-400" style={{ transform: 'translateY(-50%) translateZ(0)' }} />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="vas.email@aerodromtzl.ba"
                      className="w-full pl-14 pr-5 py-4 bg-white border border-dark-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent transition-shadow text-dark-900 placeholder:text-dark-400 shadow-soft text-base"
                      style={{ willChange: 'box-shadow' }}
                      required
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div>
                  <label htmlFor="password" className="block text-base font-semibold text-dark-700 mb-3">
                    Lozinka
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-dark-400" style={{ transform: 'translateY(-50%) translateZ(0)' }} />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-14 pr-14 py-4 bg-white border border-dark-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent transition-shadow text-dark-900 shadow-soft text-base"
                      style={{ willChange: 'box-shadow' }}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-5 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark-600 transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="w-6 h-6" />
                      ) : (
                        <Eye className="w-6 h-6" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Remember & Forgot */}
                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      className="w-4 h-4 border-dark-300 rounded text-primary-600 focus:ring-2 focus:ring-primary-500 cursor-pointer"
                    />
                    <span className="text-dark-500 group-hover:text-dark-900 transition-colors font-medium">Zapamti me</span>
                  </label>
                  <span className="text-dark-500 text-sm">
                    Zaboravili ste lozinku? Obratite se administratoru
                  </span>
                </div>

                {/* Error Message */}
                {error && (
                  <div className={`p-4 border rounded-2xl text-sm flex items-start gap-2 shadow-soft ${
                    rateLimited 
                      ? 'bg-orange-50 border-orange-200 text-orange-800' 
                      : 'bg-red-50 border-red-200 text-red-700'
                  }`}>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      rateLimited ? 'bg-orange-100' : 'bg-red-100'
                    }`}>
                      <span className="text-xs font-bold">!</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">{error}</p>
                      {rateLimited && remainingMinutes !== null && (
                        <p className="mt-1 text-xs opacity-90">
                          Molimo pokušajte ponovo za {remainingMinutes} {remainingMinutes === 1 ? 'minut' : remainingMinutes < 5 ? 'minuta' : 'minuta'}.
                        </p>
                      )}
                      {!rateLimited && remainingAttempts !== null && remainingAttempts > 0 && (
                        <p className="mt-1 text-xs opacity-90">
                          Preostalo pokušaja: {remainingAttempts}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Login Button - Optimizovano */}
                <button
                  type="submit"
                  disabled={isLoading || rateLimited}
                  className="w-full py-4 px-5 bg-gradient-to-br from-dark-900 to-dark-800 text-white font-semibold rounded-2xl hover:from-dark-800 hover:to-dark-700 focus:outline-none focus:ring-2 focus:ring-dark-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-soft-xl text-base"
                  style={{ willChange: 'transform' }}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Prijavljivanje...
                    </span>
                  ) : (
                    'Prijavi se'
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-6 text-xs text-dark-500">
            <p>Tuzla International Airport © 2025</p>
          </div>
        </div>
      </div>
    </div>
  );
}
