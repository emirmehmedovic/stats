# Multi-Language Implementation Guide (i18n)

**Verzija:** 1.0  
**Jezici:** Bosanski (bs), English (en), Deutsch (de)

---

## 📋 Pregled

Ovaj dokument pruža detaljne informacije o implementaciji multi-language podrške u Airport Statistics System aplikaciji, uključujući:

- Translation struktura
- Best practices
- Implementation examples
- Report generation u različitim jezicima
- Date/Number formatting po lokalu

---

## 🌍 Podržani Jezici

| Jezik | Kod | Locale | Format Datuma | Format Broja | Valuta |
|-------|-----|--------|---------------|--------------|--------|
| Bosanski | bs | bs-BA | DD.MM.YYYY. | 1.234.567,89 | KM |
| English | en | en-GB | DD/MM/YYYY | 1,234,567.89 | KM |
| Deutsch | de | de-DE | DD.MM.YYYY | 1.234.567,89 | € |

---

## 📁 Translation Files Struktura

```
/locales
  /bs
    ├── common.json           # Opšti UI elementi
    ├── navigation.json       # Navigacija i menu
    ├── forms.json            # Form labels i validacije
    ├── reports.json          # Report terminology
    ├── analytics.json        # Analytics metrics
    ├── emails.json           # Email templates
    └── errors.json           # Error messages
  /en
    ├── common.json
    ├── navigation.json
    ├── forms.json
    ├── reports.json
    ├── analytics.json
    ├── emails.json
    └── errors.json
  /de
    ├── common.json
    ├── navigation.json
    ├── forms.json
    ├── reports.json
    ├── analytics.json
    ├── emails.json
    └── errors.json
```

---

## 📝 Translation Files - Complete Examples

### 1. common.json (bs)

```json
{
  "app": {
    "name": "Aerodrom Tuzla - Statistika",
    "welcome": "Dobrodošli",
    "logout": "Odjavi se",
    "profile": "Profil",
    "settings": "Postavke"
  },
  "actions": {
    "save": "Sačuvaj",
    "cancel": "Otkaži",
    "delete": "Obriši",
    "edit": "Izmijeni",
    "create": "Kreiraj",
    "search": "Pretraži",
    "filter": "Filtriraj",
    "export": "Izvezi",
    "import": "Uvezi",
    "download": "Preuzmi",
    "upload": "Učitaj",
    "print": "Štampaj",
    "refresh": "Osvježi",
    "back": "Nazad",
    "next": "Dalje",
    "previous": "Prethodno",
    "submit": "Pošalji",
    "confirm": "Potvrdi",
    "close": "Zatvori"
  },
  "status": {
    "active": "Aktivan",
    "inactive": "Neaktivan",
    "pending": "Na čekanju",
    "completed": "Završeno",
    "cancelled": "Otkazano",
    "loading": "Učitavanje...",
    "success": "Uspješno",
    "error": "Greška",
    "warning": "Upozorenje"
  },
  "time": {
    "today": "Danas",
    "yesterday": "Juče",
    "tomorrow": "Sutra",
    "thisWeek": "Ove sedmice",
    "thisMonth": "Ovog mjeseca",
    "thisYear": "Ove godine",
    "lastWeek": "Prošle sedmice",
    "lastMonth": "Prošlog mjeseca",
    "lastYear": "Prošle godine"
  }
}
```

### 1. common.json (en)

```json
{
  "app": {
    "name": "Tuzla Airport - Statistics",
    "welcome": "Welcome",
    "logout": "Log out",
    "profile": "Profile",
    "settings": "Settings"
  },
  "actions": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit",
    "create": "Create",
    "search": "Search",
    "filter": "Filter",
    "export": "Export",
    "import": "Import",
    "download": "Download",
    "upload": "Upload",
    "print": "Print",
    "refresh": "Refresh",
    "back": "Back",
    "next": "Next",
    "previous": "Previous",
    "submit": "Submit",
    "confirm": "Confirm",
    "close": "Close"
  },
  "status": {
    "active": "Active",
    "inactive": "Inactive",
    "pending": "Pending",
    "completed": "Completed",
    "cancelled": "Cancelled",
    "loading": "Loading...",
    "success": "Success",
    "error": "Error",
    "warning": "Warning"
  },
  "time": {
    "today": "Today",
    "yesterday": "Yesterday",
    "tomorrow": "Tomorrow",
    "thisWeek": "This week",
    "thisMonth": "This month",
    "thisYear": "This year",
    "lastWeek": "Last week",
    "lastMonth": "Last month",
    "lastYear": "Last year"
  }
}
```

### 1. common.json (de)

```json
{
  "app": {
    "name": "Flughafen Tuzla - Statistik",
    "welcome": "Willkommen",
    "logout": "Abmelden",
    "profile": "Profil",
    "settings": "Einstellungen"
  },
  "actions": {
    "save": "Speichern",
    "cancel": "Abbrechen",
    "delete": "Löschen",
    "edit": "Bearbeiten",
    "create": "Erstellen",
    "search": "Suchen",
    "filter": "Filtern",
    "export": "Exportieren",
    "import": "Importieren",
    "download": "Herunterladen",
    "upload": "Hochladen",
    "print": "Drucken",
    "refresh": "Aktualisieren",
    "back": "Zurück",
    "next": "Weiter",
    "previous": "Zurück",
    "submit": "Senden",
    "confirm": "Bestätigen",
    "close": "Schließen"
  },
  "status": {
    "active": "Aktiv",
    "inactive": "Inaktiv",
    "pending": "Ausstehend",
    "completed": "Abgeschlossen",
    "cancelled": "Storniert",
    "loading": "Laden...",
    "success": "Erfolg",
    "error": "Fehler",
    "warning": "Warnung"
  },
  "time": {
    "today": "Heute",
    "yesterday": "Gestern",
    "tomorrow": "Morgen",
    "thisWeek": "Diese Woche",
    "thisMonth": "Diesen Monat",
    "thisYear": "Dieses Jahr",
    "lastWeek": "Letzte Woche",
    "lastMonth": "Letzter Monat",
    "lastYear": "Letztes Jahr"
  }
}
```

---

### 2. reports.json (bs)

```json
{
  "types": {
    "daily": "Dnevni izvještaj",
    "monthly": "Mjesečni izvještaj",
    "yearly": "Godišnji izvještaj",
    "custom": "Prilagođeni izvještaj",
    "comparative": "Komparativni izvještaj",
    "analytics": "Analitički izvještaj"
  },
  "metrics": {
    "flights": "Letovi",
    "passengers": "Putnici",
    "cargo": "Teret",
    "mail": "Pošta",
    "baggage": "Prtljag",
    "loadFactor": "Popunjenost",
    "onTimePerformance": "Tačnost",
    "delays": "Kašnjenja",
    "cancellations": "Otkazivanja"
  },
  "sections": {
    "overview": "Pregled",
    "summary": "Sažetak",
    "details": "Detalji",
    "statistics": "Statistika",
    "comparison": "Komparacija",
    "trends": "Trendovi",
    "forecast": "Prognoza"
  },
  "labels": {
    "total": "Ukupno",
    "average": "Prosječno",
    "minimum": "Minimum",
    "maximum": "Maksimum",
    "growth": "Rast",
    "decline": "Pad",
    "change": "Promjena",
    "period": "Period",
    "date": "Datum",
    "airline": "Aviokompanija",
    "route": "Ruta",
    "aircraft": "Avion",
    "registration": "Registracija"
  }
}
```

### 2. reports.json (en)

```json
{
  "types": {
    "daily": "Daily Report",
    "monthly": "Monthly Report",
    "yearly": "Annual Report",
    "custom": "Custom Report",
    "comparative": "Comparative Report",
    "analytics": "Analytics Report"
  },
  "metrics": {
    "flights": "Flights",
    "passengers": "Passengers",
    "cargo": "Cargo",
    "mail": "Mail",
    "baggage": "Baggage",
    "loadFactor": "Load Factor",
    "onTimePerformance": "On-Time Performance",
    "delays": "Delays",
    "cancellations": "Cancellations"
  },
  "sections": {
    "overview": "Overview",
    "summary": "Summary",
    "details": "Details",
    "statistics": "Statistics",
    "comparison": "Comparison",
    "trends": "Trends",
    "forecast": "Forecast"
  },
  "labels": {
    "total": "Total",
    "average": "Average",
    "minimum": "Minimum",
    "maximum": "Maximum",
    "growth": "Growth",
    "decline": "Decline",
    "change": "Change",
    "period": "Period",
    "date": "Date",
    "airline": "Airline",
    "route": "Route",
    "aircraft": "Aircraft",
    "registration": "Registration"
  }
}
```

### 2. reports.json (de)

```json
{
  "types": {
    "daily": "Tagesbericht",
    "monthly": "Monatsbericht",
    "yearly": "Jahresbericht",
    "custom": "Benutzerdefinierter Bericht",
    "comparative": "Vergleichsbericht",
    "analytics": "Analysebericht"
  },
  "metrics": {
    "flights": "Flüge",
    "passengers": "Passagiere",
    "cargo": "Fracht",
    "mail": "Post",
    "baggage": "Gepäck",
    "loadFactor": "Auslastung",
    "onTimePerformance": "Pünktlichkeit",
    "delays": "Verspätungen",
    "cancellations": "Stornierungen"
  },
  "sections": {
    "overview": "Übersicht",
    "summary": "Zusammenfassung",
    "details": "Details",
    "statistics": "Statistik",
    "comparison": "Vergleich",
    "trends": "Trends",
    "forecast": "Prognose"
  },
  "labels": {
    "total": "Gesamt",
    "average": "Durchschnitt",
    "minimum": "Minimum",
    "maximum": "Maximum",
    "growth": "Wachstum",
    "decline": "Rückgang",
    "change": "Änderung",
    "period": "Zeitraum",
    "date": "Datum",
    "airline": "Fluggesellschaft",
    "route": "Route",
    "aircraft": "Flugzeug",
    "registration": "Registrierung"
  }
}
```

---

### 3. analytics.json (sve tri verzije)

**Bosanski (bs):**
```json
{
  "comparisons": {
    "yoy": "Godina-na-godinu (YoY)",
    "qoq": "Kvartal-na-kvartal (QoQ)",
    "mom": "Mjesec-na-mjesec (MoM)",
    "periodToPeriod": "Period-na-period"
  },
  "kpis": {
    "rpk": "Revenue Passenger Kilometers (RPK)",
    "ask": "Available Seat Kilometers (ASK)",
    "rask": "Revenue per ASK",
    "cask": "Cost per ASK",
    "breakEven": "Break-even Load Factor"
  },
  "analysis": {
    "seasonal": "Sezonska analiza",
    "trend": "Analiza trenda",
    "forecast": "Prognoza",
    "benchmark": "Benchmark",
    "marketShare": "Tržišni udio",
    "profitability": "Profitabilnost"
  }
}
```

**English (en):**
```json
{
  "comparisons": {
    "yoy": "Year-over-Year (YoY)",
    "qoq": "Quarter-over-Quarter (QoQ)",
    "mom": "Month-over-Month (MoM)",
    "periodToPeriod": "Period-to-Period"
  },
  "kpis": {
    "rpk": "Revenue Passenger Kilometers (RPK)",
    "ask": "Available Seat Kilometers (ASK)",
    "rask": "Revenue per ASK",
    "cask": "Cost per ASK",
    "breakEven": "Break-even Load Factor"
  },
  "analysis": {
    "seasonal": "Seasonal Analysis",
    "trend": "Trend Analysis",
    "forecast": "Forecast",
    "benchmark": "Benchmark",
    "marketShare": "Market Share",
    "profitability": "Profitability"
  }
}
```

**Deutsch (de):**
```json
{
  "comparisons": {
    "yoy": "Jahr-zu-Jahr (YoY)",
    "qoq": "Quartal-zu-Quartal (QoQ)",
    "mom": "Monat-zu-Monat (MoM)",
    "periodToPeriod": "Zeitraum-zu-Zeitraum"
  },
  "kpis": {
    "rpk": "Revenue Passenger Kilometers (RPK)",
    "ask": "Available Seat Kilometers (ASK)",
    "rask": "Umsatz pro ASK",
    "cask": "Kosten pro ASK",
    "breakEven": "Break-even-Auslastung"
  },
  "analysis": {
    "seasonal": "Saisonale Analyse",
    "trend": "Trendanalyse",
    "forecast": "Prognose",
    "benchmark": "Benchmark",
    "marketShare": "Marktanteil",
    "profitability": "Rentabilität"
  }
}
```

---

## 💻 Implementation Code Examples

### 1. Next.js i18n Middleware

```typescript
// middleware.ts
import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  locales: ['bs', 'en', 'de'],
  defaultLocale: 'bs',
  localePrefix: 'as-needed'
});

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
```

### 2. Root Layout sa Language Provider

```typescript
// app/[locale]/layout.tsx
import { NextIntlClientProvider } from 'next-intl';
import { notFound } from 'next/navigation';

export function generateStaticParams() {
  return [{ locale: 'bs' }, { locale: 'en' }, { locale: 'de' }];
}

export default async function LocaleLayout({
  children,
  params: { locale }
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  let messages;
  try {
    messages = (await import(`@/locales/${locale}/common.json`)).default;
  } catch (error) {
    notFound();
  }

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

### 3. Component Usage Example

```typescript
// components/ReportHeader.tsx
'use client';

import { useTranslations } from 'next-intl';

export function ReportHeader({ type }: { type: string }) {
  const t = useTranslations('reports');
  
  return (
    <div>
      <h1>{t(`types.${type}`)}</h1>
      <p>{t('sections.overview')}</p>
    </div>
  );
}
```

### 4. Date Formatting

```typescript
// lib/formatters.ts
import { format } from 'date-fns';
import { bs, enGB, de } from 'date-fns/locale';

const locales = { bs, en: enGB, de };

export function formatDate(
  date: Date,
  locale: 'bs' | 'en' | 'de',
  formatStr: string = 'dd.MM.yyyy.'
): string {
  return format(date, formatStr, { locale: locales[locale] });
}

// Usage:
formatDate(new Date(), 'bs', 'dd. MMMM yyyy.'); // "21. novembar 2025."
formatDate(new Date(), 'en', 'dd MMMM yyyy');   // "21 November 2025"
formatDate(new Date(), 'de', 'dd. MMMM yyyy');  // "21. November 2025"
```

### 5. Number Formatting

```typescript
// lib/formatters.ts
export function formatNumber(
  value: number,
  locale: 'bs' | 'en' | 'de',
  options?: Intl.NumberFormatOptions
): string {
  const localeMap = {
    bs: 'bs-BA',
    en: 'en-GB',
    de: 'de-DE'
  };

  return new Intl.NumberFormat(localeMap[locale], options).format(value);
}

// Usage:
formatNumber(1234567.89, 'bs');  // "1.234.567,89"
formatNumber(1234567.89, 'en');  // "1,234,567.89"
formatNumber(1234567.89, 'de');  // "1.234.567,89"

// With currency:
formatNumber(1500, 'bs', { style: 'currency', currency: 'BAM' });  // "1.500,00 KM"
```

### 6. PDF Export with Language

```typescript
// lib/pdf-generator.ts
import { jsPDF } from 'jspdf';
import { formatDate, formatNumber } from './formatters';

export async function generatePDF(
  data: ReportData,
  locale: 'bs' | 'en' | 'de'
) {
  const doc = new jsPDF();
  const translations = await import(`@/locales/${locale}/reports.json`);

  // Title
  doc.setFontSize(20);
  doc.text(translations.types.daily, 20, 20);

  // Date
  doc.setFontSize(12);
  doc.text(
    `${translations.labels.date}: ${formatDate(data.date, locale)}`,
    20,
    30
  );

  // Metrics
  doc.text(
    `${translations.metrics.passengers}: ${formatNumber(data.passengers, locale)}`,
    20,
    40
  );

  // ... rest of the report

  return doc.output('blob');
}
```

### 7. Excel Export with Language

```typescript
// lib/excel-generator.ts
import * as XLSX from 'xlsx';

export async function generateExcel(
  data: ReportData[],
  locale: 'bs' | 'en' | 'de'
) {
  const translations = await import(`@/locales/${locale}/reports.json`);

  // Create headers based on language
  const headers = [
    translations.labels.date,
    translations.metrics.flights,
    translations.metrics.passengers,
    translations.metrics.cargo,
    translations.labels.airline,
    // ...
  ];

  // Format data
  const formattedData = data.map(row => [
    formatDate(row.date, locale),
    row.flights,
    formatNumber(row.passengers, locale),
    formatNumber(row.cargo, locale),
    row.airline,
    // ...
  ]);

  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet([headers, ...formattedData]);

  // Create workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, translations.types.daily);

  // Generate file
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}
```

---

## 🎨 Language Switcher Component

```typescript
// components/LanguageSwitcher.tsx
'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';

const languages = [
  { code: 'bs', name: 'Bosanski', flag: '🇧🇦' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' }
];

export function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const currentLocale = useLocale();

  const handleLanguageChange = (newLocale: string) => {
    // Remove current locale from pathname
    const newPathname = pathname.replace(`/${currentLocale}`, `/${newLocale}`);
    router.push(newPathname);
  };

  return (
    <div className="flex gap-2">
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => handleLanguageChange(lang.code)}
          className={`px-3 py-1 rounded ${
            currentLocale === lang.code
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 hover:bg-gray-300'
          }`}
        >
          {lang.flag} {lang.name}
        </button>
      ))}
    </div>
  );
}
```

---

## 📧 Email Templates Multi-Language

### Email Template Structure

```typescript
// lib/email-templates.ts
import { formatDate } from './formatters';

export async function getLicenseExpiryEmail(
  employeeName: string,
  licenseName: string,
  expiryDate: Date,
  daysRemaining: number,
  locale: 'bs' | 'en' | 'de'
): Promise<{ subject: string; body: string }> {
  const translations = await import(`@/locales/${locale}/emails.json`);

  const subject = translations.licenseExpiry.subject
    .replace('{days}', daysRemaining.toString());

  const body = translations.licenseExpiry.body
    .replace('{employeeName}', employeeName)
    .replace('{licenseName}', licenseName)
    .replace('{expiryDate}', formatDate(expiryDate, locale))
    .replace('{daysRemaining}', daysRemaining.toString());

  return { subject, body };
}
```

### emails.json (bs)

```json
{
  "licenseExpiry": {
    "subject": "Istek licence za {days} dana",
    "body": "Poštovani/a {employeeName},\n\nObavještavamo Vas da Vaša licenca '{licenseName}' ističe {expiryDate} (za {daysRemaining} dana).\n\nMolimo Vas da na vrijeme obnovite licencu.\n\nS poštovanjem,\nAerodrom Tuzla"
  }
}
```

### emails.json (en)

```json
{
  "licenseExpiry": {
    "subject": "License Expiry in {days} Days",
    "body": "Dear {employeeName},\n\nThis is to inform you that your license '{licenseName}' will expire on {expiryDate} (in {daysRemaining} days).\n\nPlease renew your license on time.\n\nBest regards,\nTuzla Airport"
  }
}
```

### emails.json (de)

```json
{
  "licenseExpiry": {
    "subject": "Lizenzablauf in {days} Tagen",
    "body": "Sehr geehrte/r {employeeName},\n\nwir möchten Sie darüber informieren, dass Ihre Lizenz '{licenseName}' am {expiryDate} abläuft (in {daysRemaining} Tagen).\n\nBitte erneuern Sie Ihre Lizenz rechtzeitig.\n\nMit freundlichen Grüßen,\nFlughafen Tuzla"
  }
}
```

---

## ✅ Testing i18n

### 1. Unit Test Example

```typescript
// __tests__/i18n/translations.test.ts
import { describe, it, expect } from 'vitest';

describe('Translation Keys', () => {
  it('should have all required keys in all languages', async () => {
    const languages = ['bs', 'en', 'de'];
    const requiredKeys = ['common', 'reports', 'analytics'];

    for (const lang of languages) {
      for (const key of requiredKeys) {
        const translations = await import(`@/locales/${lang}/${key}.json`);
        expect(translations).toBeDefined();
      }
    }
  });

  it('should have matching keys across languages', async () => {
    const bs = await import('@/locales/bs/common.json');
    const en = await import('@/locales/en/common.json');
    const de = await import('@/locales/de/common.json');

    expect(Object.keys(bs)).toEqual(Object.keys(en));
    expect(Object.keys(bs)).toEqual(Object.keys(de));
  });
});
```

### 2. Integration Test

```typescript
// __tests__/reports/pdf-generation.test.ts
import { generatePDF } from '@/lib/pdf-generator';

describe('PDF Generation with i18n', () => {
  it('should generate PDF in Bosnian', async () => {
    const pdf = await generatePDF(mockData, 'bs');
    expect(pdf).toBeDefined();
    // Check for Bosnian specific text
  });

  it('should generate PDF in English', async () => {
    const pdf = await generatePDF(mockData, 'en');
    expect(pdf).toBeDefined();
    // Check for English specific text
  });

  it('should generate PDF in German', async () => {
    const pdf = await generatePDF(mockData, 'de');
    expect(pdf).toBeDefined();
    // Check for German specific text
  });
});
```

---

## 📚 Best Practices

### 1. Translation Keys Naming Convention

```
# Good
reports.metrics.passengers
common.actions.save
analytics.comparisons.yoy

# Bad
passengerMetric
saveBtn
yearOverYear
```

### 2. Avoid Hardcoded Strings

```typescript
// ❌ Bad
<button>Save</button>

// ✅ Good
<button>{t('actions.save')}</button>
```

### 3. Handle Pluralization

```json
{
  "flights": {
    "count_one": "{count} let",
    "count_few": "{count} leta",
    "count_many": "{count} letova",
    "count_other": "{count} letova"
  }
}
```

```typescript
t('flights.count', { count: 5 }); // "5 letova"
```

### 4. Date/Time Consistency

Always use locale-aware formatters, never hardcode formats.

```typescript
// ❌ Bad
date.toLocaleDateString();

// ✅ Good
formatDate(date, locale);
```

---

## 🚀 Deployment Checklist

- [ ] All translation files complete
- [ ] No hardcoded strings in UI
- [ ] Date/number formatting tested for all locales
- [ ] PDF exports tested in all languages
- [ ] Excel exports tested in all languages
- [ ] Email templates tested in all languages
- [ ] Language switcher working
- [ ] Default locale set correctly
- [ ] Translation keys validated
- [ ] Browser language detection working
- [ ] User language preference saved in database

---

**Dokument završen.**  
**Za dodatna pitanja ili izmjene, kontaktirajte development tim.**
