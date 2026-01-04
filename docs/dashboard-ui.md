Pomislio na 2m 59s
# Dashboard UI – uputstvo za implementaciju (Tailwind)

Ovaj dokument opisuje kako da implementiraš dashboard koji vizuelno prati referentni dizajn (light tema, plavo kao primarna boja, zaobljene kartice, clean layout).

Primjer koda koristi **React + Tailwind CSS**, ali iste klase možeš koristiti i u bilo kom drugom front-end stacku.

---

## 1. Osnovna Tailwind postavka

Ako već imaš Tailwind u projektu, ovaj korak preskoči.

```bash
# primjer za Vite + React
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p


U tailwind.config.js dodaj putanje do fajlova:

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      // vidi sekciju 2 – dizajn sistem
    },
  },
  plugins: [],
};


U src/index.css (ili globalni CSS) uključi Tailwind:

@tailwind base;
@tailwind components;
@tailwind utilities;

2. Dizajn sistem (boje, tipografija, radius, shadow)
2.1. Palette (približne vrijednosti iz dizajna)

U tailwind.config.js u theme.extend dodaj:

theme: {
  extend: {
    colors: {
      // brand
      primary: '#3392C5',       // plava (dugmad, istaknute vrijednosti)
      primarySoft: '#E4F3FB',   // blagi plavi background

      // pozadine
      appBg: '#D8D8D8',         // siva oko cijelog prozora
      shellBg: '#F1F1F3',       // svijetla siva iza kartica
      sidebarBg: '#FBFBFB',     // čisto bijela lijeva kolona
      cardBg: '#F1F1F1',

      // tekst
      textMain: '#202124',      // tamni tekst (naslovi)
      textMuted: '#9A9A9A',     // sekundarni tekst, opisi

      // ostalo
      borderSoft: '#E2E2E4',
      success: '#16A34A',
      danger: '#EF4444',
    },
    fontFamily: {
      sans: ['system-ui', 'SF Pro Text', 'Inter', 'sans-serif'],
    },
    borderRadius: {
      xl: '0.75rem',
      '2xl': '1rem',
      '3xl': '1.5rem', // koristi za velike kartice/container
    },
    boxShadow: {
      soft: '0 10px 30px rgba(15, 23, 42, 0.08)', // mekana sjena
    },
  },
}

2.2. Globalni stil tijela

U index.css (nakon tailwind direktiva) napravi mali reset:

body {
  @apply bg-appBg font-sans text-textMain;
}

3. Struktura layouta

Dashboard ima tri glavna nivoa:

Sivi background (window)

Bijeli “browser” shell sa zaobljenim uglovima

Unutrašnji grid: lijevi sidebar + glavni sadržaj

3.1. Root container (“browser” shell)
// App.tsx (primjer)
export default function App() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-appBg">
      <div className="w-full max-w-6xl xl:max-w-7xl bg-white rounded-3xl shadow-soft overflow-hidden">
        <DashboardLayout />
      </div>
    </div>
  );
}

4. Layout: sidebar + main
function DashboardLayout() {
  return (
    <div className="flex h-[800px]">
      {/* Sidebar */}
      <aside className="w-64 bg-sidebarBg border-r border-borderSoft flex flex-col justify-between p-6">
        <SidebarTop />
        <SidebarBottom />
      </aside>

      {/* Main */}
      <main className="flex-1 bg-shellBg">
        <Header />
        <Content />
      </main>
    </div>
  );
}

4.1. Sidebar – struktura

Gore: logo, “Hey, need help?”, glavne sekcije
Dole: “Unlock all features” kartica

function SidebarTop() {
  return (
    <div className="space-y-8">
      {/* Logo + naziv */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white font-semibold">
          UX
        </div>
        <div>
          <p className="text-xs text-textMuted leading-tight">UIX Design Lab</p>
          <p className="text-[11px] text-textMuted">Dashboard</p>
        </div>
      </div>

      {/* Help tekst */}
      <div>
        <p className="text-lg font-semibold text-textMain">Hey, Need help?</p>
        <p className="text-sm text-textMuted">Just ask me anything!</p>
      </div>

      {/* Navigacija */}
      <nav className="space-y-6 text-sm">
        <div>
          <p className="text-[11px] font-semibold text-textMuted mb-2">HOME</p>
          <SidebarItem active label="Overview" />
          <SidebarItem label="Legality Statement" />
          <SidebarItem label="Financial Projection" />
          <SidebarItem label="Account" />
        </div>

        <div>
          <p className="text-[11px] font-semibold text-textMuted mb-2">POCKET</p>
          <SidebarItem label="Savings" />
          <SidebarItem label="Emergency Funds" />
        </div>
      </nav>
    </div>
  );
}

type SidebarItemProps = {
  label: string;
  active?: boolean;
};

function SidebarItem({ label, active }: SidebarItemProps) {
  return (
    <button
      className={[
        'w-full flex items-center justify-between rounded-xl px-3 py-2 text-left transition',
        active
          ? 'bg-black text-white'
          : 'text-textMain hover:bg-cardBg',
      ].join(' ')}
    >
      <span className="text-sm">{label}</span>
      {active && <span className="h-2 w-2 rounded-full bg-primary" />}
    </button>
  );
}


Donja kartica (“Unlock all features”):

function SidebarBottom() {
  return (
    <div className="mt-8">
      <div className="rounded-3xl bg-cardBg p-4 flex flex-col justify-between min-h-[170px]">
        <div>
          <p className="text-sm font-semibold text-textMain">Unlock all features</p>
          <p className="mt-1 text-xs text-textMuted">45+ minutes</p>
        </div>
        <button className="mt-4 w-full rounded-2xl bg-black text-white text-xs py-2">
          15 day free trial
        </button>
      </div>
    </div>
  );
}

5. Header (top bar + naslov)

Top bar u dizajnu sadrži: “search bar”, datum, ikone, profil.

function Header() {
  return (
    <header className="px-8 pt-5 pb-4 border-b border-borderSoft bg-white">
      {/* Top row */}
      <div className="flex items-center justify-between gap-4">
        {/* Fake URL bar / search */}
        <div className="flex-1">
          <div className="flex items-center gap-3 rounded-full bg-shellBg px-4 py-2 text-sm text-textMuted">
            <span className="i-mdi-magnify" /> {/* ili neka tvoja ikona */}
            <input
              type="text"
              placeholder="Search anything..."
              className="bg-transparent outline-none flex-1 text-xs"
            />
          </div>
        </div>

        {/* Datum, ikone, profil */}
        <div className="flex items-center gap-4 text-xs text-textMuted">
          <div className="flex items-center gap-2 rounded-full bg-shellBg px-3 py-1.5">
            <span className="font-semibold text-textMain">21</span>
            <span>Sat, November</span>
          </div>

          <button className="h-9 w-9 rounded-full bg-shellBg" />
          <button className="h-9 w-9 rounded-full bg-shellBg" />

          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-full bg-primary" />
            <div className="leading-tight">
              <p className="text-xs font-semibold text-textMain">Sk Tahsin Ahmed</p>
              <p className="text-[10px] text-textMuted">CEO</p>
            </div>
          </div>
        </div>
      </div>

      {/* Naslov + breadcrumb */}
      <div className="mt-6">
        <p className="text-xs text-textMuted">Home &gt; <span className="text-textMain">Overview</span></p>
        <h1 className="mt-2 text-2xl font-semibold text-textMain">
          Financial Overview
        </h1>
      </div>
    </header>
  );
}

6. Glavni sadržaj (grid kartica)

Glavni dio je svijetlosiva pozadina sa karticama:

prvi red: Visa kartica + 3 kartice s grafovima + “System lock”

drugi red: 3 manje kartice (dani, graf, stocks)

treći red: Activity manager (široka kartica)

6.1. Wrapper za sadržaj
function Content() {
  return (
    <div className="px-8 py-6 space-y-6">
      {/* Prvi red kartica */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <CardVisa />
        <CardIncome />
        <CardPaid />
        <CardSystemLock />
      </div>

      {/* Drugi red */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <CardDays />
        <CardYearCompare />
        <CardStocks />
      </div>

      {/* Treći red – Activity manager */}
      <ActivityManager />
    </div>
  );
}

6.2. Osnovna komponenta kartice

Možeš definirati generičku komponentu za dosljednost:

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-3xl shadow-soft px-5 py-4">
      {children}
    </div>
  );
}


Zatim je koristiš:

function CardVisa() {
  return (
    <Card>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm font-semibold text-textMain">VISA</p>
        <span className="text-[11px] text-textMuted">Direct Debits</span>
      </div>

      <div className="mb-4">
        <p className="text-xs text-textMuted">Linked to main account</p>
        <p className="mt-1 text-lg font-semibold tracking-widest">
          •••• 2829
        </p>
      </div>

      <div className="flex gap-3">
        <button className="flex-1 rounded-full bg-black text-white text-xs py-2">
          Receive
        </button>
        <button className="flex-1 rounded-full border border-borderSoft text-xs py-2">
          Send
        </button>
      </div>

      <div className="mt-4 flex justify-between items-center">
        <div>
          <p className="text-[11px] text-textMuted">Linked to main account</p>
          <p className="text-sm font-semibold text-primary">$ 50.00</p>
        </div>
        <button className="text-[11px] text-primary">Edit cards limitation</button>
      </div>
    </Card>
  );
}


Ostale kartice (Income, Paid, Days, Stocks, System Lock, Activity Manager) možeš slagati na isti način: naslovi gore, vrijednosti istaknute plavom, male grafove možeš odraditi:

kao fake graf koristeći flex + h-1.5 w-1.5 rounded-full bg-primary tačkice, ili

kasnije integrisati pravu biblioteku (npr. Recharts).

7. Aktivnost / Activity manager kartica

Ovo je široka kartica puna filtera i grafova. Glavna struktura:

function ActivityManager() {
  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-textMain">Activity manager</h2>
        <div className="flex items-center gap-3 text-xs text-textMuted">
          <button>Filters</button>
        </div>
      </div>

      {/* Search + filteri */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">
        <div className="flex-1 flex items-center gap-2 rounded-full bg-shellBg px-4 py-2 text-xs text-textMuted">
          <span className="i-mdi-magnify" />
          <input
            placeholder="Search in activities..."
            className="bg-transparent outline-none flex-1"
          />
        </div>

        <div className="flex gap-2 text-xs">
          <FilterPill label="Team" />
          <FilterPill label="Insights" />
          <FilterPill label="Today" />
        </div>
      </div>

      {/* grid unutar kartice */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <CardMini title="$ 41.30 USD" subtitle="Current balance" />
        <CardMini title="Business plans" subtitle="Bank loans / Accounting / HR Management" />
        <CardMiniCTA />
        <CardMiniSun />
      </div>
    </Card>
  );
}

function FilterPill({ label }: { label: string }) {
  return (
    <button className="px-3 py-1.5 rounded-full bg-white border border-borderSoft text-textMain">
      {label}
    </button>
  );
}

function CardMini({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="bg-white rounded-3xl border border-borderSoft px-4 py-3 text-xs">
      <p className="text-lg font-semibold text-primary">{title}</p>
      <p className="mt-2 text-[11px] text-textMuted">{subtitle}</p>
    </div>
  );
}

8. Responsivnost

Do md breakpointa (md:) koristi single-column grid (grid-cols-1).

Od md naviše koristi 3–4 kolone kao u dizajnu.

Sidebar na mobilnom možeš kasnije pretvoriti u “drawer”, za početak može ostati fiksni.

Primjeri:

className="grid grid-cols-1 md:grid-cols-4 gap-4"

className="hidden md:flex" za elemente koje ne želiš na malim ekranima.

9. Kratak checklist

 Dodan Tailwind i proširen theme (primary, appBg, sidebarBg, cardBg, textMain, textMuted…)

 Root container sa sivom pozadinom i bijelim, zaobljenim “shellom”

 Lijevi sidebar: logo, help tekst, navigacija, bottom kartica

 Header: search bar, datum, ikone, profil, naslov “Financial Overview”

 Grid kartica raspoređen po redovima kao na dizajnu

 Ujednačen radius (rounded-3xl) i soft shadow (shadow-soft) za sve kartice

 Primarna plava (bg-primary, text-primary) za istaknute elemente i CTA dugmad
