'use client';

import { useState, useEffect, useCallback } from 'react';

interface FlipCharacterProps {
  char: string;
  color: 'primary' | 'white';
  isFlipping: boolean;
}

function FlipCharacter({ char, color, isFlipping }: FlipCharacterProps) {
  const colorClass = color === 'primary' ? 'text-primary-400' : 'text-white';

  if (char === ' ') {
    return <div className="w-2 sm:w-3 lg:w-4" />;
  }

  return (
    <div
      className={`
        relative w-5 h-7 sm:w-7 sm:h-9 lg:w-9 lg:h-12 bg-dark-800 rounded-sm overflow-hidden
        ${isFlipping ? 'animate-flip' : ''}
      `}
      style={{ boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.3)' }}
    >
      {/* Top half */}
      <div className="absolute inset-x-0 top-0 h-1/2 bg-dark-700" />
      {/* Bottom half */}
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-dark-800" />
      {/* Character */}
      <span
        className={`
          absolute inset-0 flex items-center justify-center
          text-sm sm:text-lg lg:text-2xl font-bold tracking-tight
          ${colorClass}
        `}
        style={{ fontFamily: "'Courier New', monospace" }}
      >
        {char}
      </span>
      {/* Split line */}
      <div className="absolute inset-x-0 top-1/2 h-px bg-dark-900 -translate-y-1/2" />
      {/* Highlight */}
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-b from-white/5 to-transparent" />
    </div>
  );
}

interface FlipboardRowProps {
  label: string;
  value: string;
  valueColor?: 'primary' | 'white';
  isFlipping: boolean;
}

function FlipboardRow({ label, value, valueColor = 'white', isFlipping }: FlipboardRowProps) {
  // Split value into words to prevent word breaking
  const words = value.split(' ');

  return (
    <div className="flex items-center gap-3 sm:gap-4 lg:gap-6 py-3 sm:py-4 lg:py-5 border-b border-dark-700/50 last:border-b-0">
      {/* Label */}
      <div className="w-20 sm:w-28 lg:w-36 flex-shrink-0">
        <span className="text-[10px] sm:text-xs lg:text-sm font-semibold text-dark-400 tracking-wider uppercase">
          {label}
        </span>
      </div>

      {/* Value - Split flap characters grouped by words */}
      <div className="flex-1 flex flex-wrap gap-x-2 gap-y-1 sm:gap-x-3 sm:gap-y-1.5 lg:gap-x-4 lg:gap-y-2">
        {words.map((word, wordIndex) => (
          <div key={wordIndex} className="flex gap-[2px] sm:gap-1 lg:gap-1.5 flex-shrink-0">
            {word.split('').map((char, charIndex) => (
              <FlipCharacter
                key={`${wordIndex}-${charIndex}-${char}`}
                char={char}
                color={valueColor}
                isFlipping={isFlipping}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// Message sets that rotate
const messages = [
  {
    destination: { value: 'VEĆA VIDLJIVOST', color: 'primary' as const },
    gate: { value: 'VAŠ BREND', color: 'white' as const },
    status: { value: 'POZICIJE DOSTUPNE', color: 'primary' as const },
  },
  {
    destination: { value: 'NOVI KLIJENTI', color: 'primary' as const },
    gate: { value: 'VAŠA PORUKA', color: 'white' as const },
    status: { value: 'REZERVIŠITE DANAS', color: 'primary' as const },
  },
  {
    destination: { value: 'VIŠE PRODAJE', color: 'primary' as const },
    gate: { value: 'PREMIUM LOKACIJE', color: 'white' as const },
    status: { value: 'KONTAKTIRAJTE NAS', color: 'primary' as const },
  },
  {
    destination: { value: '500K PUTNIKA', color: 'primary' as const },
    gate: { value: 'GODIŠNJE', color: 'white' as const },
    status: { value: 'VAŠA PUBLIKA', color: 'primary' as const },
  },
];

export function Flipboard() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);

  const flipToNext = useCallback(() => {
    setIsFlipping(true);

    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % messages.length);
      setIsFlipping(false);
    }, 300);
  }, []);

  useEffect(() => {
    const interval = setInterval(flipToNext, 4000);
    return () => clearInterval(interval);
  }, [flipToNext]);

  const current = messages[currentIndex];

  return (
    <div className="relative w-full">
      {/* CSS for flip animation */}
      <style jsx global>{`
        @keyframes flipDown {
          0% {
            transform: perspective(400px) rotateX(0deg);
            opacity: 1;
          }
          50% {
            transform: perspective(400px) rotateX(-90deg);
            opacity: 0.5;
          }
          100% {
            transform: perspective(400px) rotateX(0deg);
            opacity: 1;
          }
        }
        .animate-flip {
          animation: flipDown 0.3s ease-in-out;
        }
      `}</style>

      {/* Board container */}
      <div
        className="bg-dark-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 border-4 lg:border-6 border-dark-800"
        style={{
          boxShadow: '0 20px 40px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.05)',
        }}
      >
        {/* Header bar */}
        <div className="flex items-center justify-between mb-4 sm:mb-5 lg:mb-6 pb-3 sm:pb-4 border-b border-dark-700/50">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] sm:text-xs lg:text-sm text-dark-400 font-semibold tracking-widest uppercase">
              Live Info
            </span>
          </div>
          <div className="flex gap-1.5 sm:gap-2">
            {messages.map((_, idx) => (
              <div
                key={idx}
                className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-colors duration-300 ${
                  idx === currentIndex ? 'bg-primary-500' : 'bg-dark-700'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Rows */}
        <div>
          <FlipboardRow
            label="Destinacija"
            value={current.destination.value}
            valueColor={current.destination.color}
            isFlipping={isFlipping}
          />
          <FlipboardRow
            label="Gate"
            value={current.gate.value}
            valueColor={current.gate.color}
            isFlipping={isFlipping}
          />
          <FlipboardRow
            label="Status"
            value={current.status.value}
            valueColor={current.status.color}
            isFlipping={isFlipping}
          />
        </div>

        {/* Footer */}
        <div className="mt-4 sm:mt-5 lg:mt-6 pt-3 sm:pt-4 border-t border-dark-700/50 flex items-center justify-between">
          <span className="text-[9px] sm:text-[10px] lg:text-xs text-dark-500 font-mono tracking-wider">TZL AIRPORT</span>
          <div className="flex items-center gap-2">
            <span className="text-[9px] sm:text-[10px] lg:text-xs text-dark-500 font-mono">ADVERTISING</span>
          </div>
        </div>
      </div>
    </div>
  );
}
