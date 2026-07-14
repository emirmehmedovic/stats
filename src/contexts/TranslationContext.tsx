'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import bsTranslations from '@/locales/bs.json';
import enTranslations from '@/locales/en.json';

type Language = 'BS' | 'EN';
type TranslationKey = string;

interface TranslationContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
  isEnglish: boolean;
}

const translations: Record<Language, typeof bsTranslations> = {
  BS: bsTranslations,
  EN: enTranslations,
};

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

function getNestedValue(obj: any, path: string): string | undefined {
  const keys = path.split('.');
  let current = obj;

  for (const key of keys) {
    if (current === undefined || current === null) {
      return undefined;
    }
    current = current[key];
  }

  return typeof current === 'string' ? current : undefined;
}

function interpolate(text: string, params?: Record<string, string | number>): string {
  if (!params) return text;

  return text.replace(/\{(\w+)\}/g, (match, key) => {
    return params[key] !== undefined ? String(params[key]) : match;
  });
}

interface TranslationProviderProps {
  children: ReactNode;
  initialLanguage?: Language;
}

export function TranslationProvider({ children, initialLanguage }: TranslationProviderProps) {
  const [language, setLanguageState] = useState<Language>(initialLanguage || 'BS');

  useEffect(() => {
    // Check localStorage for language preference
    const checkLanguage = () => {
      const storedLanguage = localStorage.getItem('userLanguage') as Language | null;
      const userRole = localStorage.getItem('userRole');

      // AUDITOR defaults to English
      if (userRole === 'AUDITOR' && !storedLanguage) {
        setLanguageState('EN');
        localStorage.setItem('userLanguage', 'EN');
        return;
      }

      if (storedLanguage && (storedLanguage === 'BS' || storedLanguage === 'EN')) {
        setLanguageState(storedLanguage);
      }
    };

    checkLanguage();

    // Listen for storage changes (when user logs in)
    const handleStorageChange = () => {
      checkLanguage();
    };

    window.addEventListener('storage', handleStorageChange);

    // Also check periodically for same-tab updates
    const interval = setInterval(checkLanguage, 500);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('userLanguage', lang);
  };

  const t = (key: TranslationKey, params?: Record<string, string | number>): string => {
    const translation = getNestedValue(translations[language], key);

    if (translation === undefined) {
      // Fallback to Bosnian if key not found
      const fallback = getNestedValue(translations.BS, key);
      if (fallback) {
        return interpolate(fallback, params);
      }
      // Return the key itself if not found in any language
      console.warn(`Translation key not found: ${key}`);
      return key;
    }

    return interpolate(translation, params);
  };

  const value: TranslationContextType = {
    language,
    setLanguage,
    t,
    isEnglish: language === 'EN',
  };

  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslation(): TranslationContextType {
  const context = useContext(TranslationContext);

  if (context === undefined) {
    // Return a default implementation for components outside the provider
    return {
      language: 'BS',
      setLanguage: () => {},
      t: (key: string) => key,
      isEnglish: false,
    };
  }

  return context;
}

// Hook to check if user is an auditor (for showing read-only notices)
export function useIsAuditor(): boolean {
  const [isAuditor, setIsAuditor] = useState(false);

  useEffect(() => {
    const checkRole = () => {
      const role = localStorage.getItem('userRole');
      setIsAuditor(role === 'AUDITOR');
    };

    checkRole();

    // Listen for changes
    const interval = setInterval(checkRole, 500);
    window.addEventListener('storage', checkRole);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', checkRole);
    };
  }, []);

  return isAuditor;
}

// Hook to check if user can edit (not AUDITOR or VIEWER)
export function useCanEdit(): boolean {
  const [canEdit, setCanEdit] = useState(true);

  useEffect(() => {
    const checkRole = () => {
      const role = localStorage.getItem('userRole');
      // AUDITOR and VIEWER cannot edit
      setCanEdit(role !== 'AUDITOR' && role !== 'VIEWER');
    };

    checkRole();

    const interval = setInterval(checkRole, 500);
    window.addEventListener('storage', checkRole);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', checkRole);
    };
  }, []);

  return canEdit;
}

// Utility component to show read-only notice for auditors
export function AuditorNotice() {
  const { t, isEnglish } = useTranslation();
  const isAuditor = useIsAuditor();

  if (!isAuditor) return null;

  return (
    <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-2">
      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span className="text-sm text-blue-800">
        {t('auditor.readOnlyNotice')} {t('auditor.exportAllowed')}
      </span>
    </div>
  );
}
