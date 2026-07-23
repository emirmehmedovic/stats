export interface AdvertisingPosition {
  id: string;
  title: string;
  description: string;
  dimensions: string;
  location: string;
  available: boolean;
  image: string;
}

export interface ProcessStep {
  number: string;
  title: string;
  description: string;
}

export interface BenefitItem {
  icon: 'globe' | 'eye' | 'layout';
  title: string;
  description: string;
}

export interface PricingItem {
  id: string;
  name: string;
  price: number;
  unit: string;
  details?: string;
}

export interface PricingCategory {
  id: string;
  title: string;
  description: string;
  icon: 'building' | 'monitor' | 'globe' | 'signpost';
  items: PricingItem[];
}

// Indoor advertising positions
export const indoorAdvertising: PricingItem[] = [
  { id: 'a1-a8', name: 'Svijetleća reklama A1-A8', price: 200, unit: 'mjesec', details: 'Glavni hol putničkog terminala' },
  { id: 'b1-b3', name: 'Svijetleća reklama B1-B3', price: 200, unit: 'mjesec', details: 'Glavni hol putničkog terminala' },
  { id: 'd1-d3', name: 'Svijetleća reklama D1-D3', price: 200, unit: 'mjesec', details: 'Prostor "Odlasci"' },
  { id: 'e1-e2', name: 'Svijetleća reklama E1-E2', price: 200, unit: 'mjesec', details: 'Prostor "Odlasci"' },
  { id: 't1-t2', name: 'Reklamna površina T1-T2', price: 350, unit: 'mjesec', details: 'Prostor "Dolasci" - 2 pozicije' },
  { id: 't3', name: 'Reklamna površina T3', price: 350, unit: 'mjesec', details: 'Prostor "Dolasci"' },
  { id: 'z1', name: 'Zidna površina Z1 iza check-in šaltera', price: 1000, unit: 'mjesec', details: 'Glavni hol terminala' },
  { id: 'z2', name: 'Zidna površina Z2', price: 500, unit: 'mjesec', details: 'Dolazni hol kod rent-a-car' },
  { id: 'glavni-ulaz-vani', name: 'Brendiranje glavnog ulaza - vanjska strana', price: 1300, unit: 'mjesec', details: 'Premium pozicija' },
  { id: 'glavni-ulaz-unutra', name: 'Brendiranje glavnog ulaza - unutrašnja strana', price: 1400, unit: 'mjesec', details: 'Premium pozicija' },
  { id: 'fasada-desno-vani', name: 'Ostakljena fasada desno od ulaza', price: 1500, unit: 'mjesec', details: 'Vanjska strana' },
  { id: 'fasada-lijevo', name: 'Ostakljena fasada lijevo od ulaza', price: 2000, unit: 'mjesec', details: 'Premium pozicija' },
  { id: 'klizna-vrata-dolasci', name: 'Klizna vrata "Dolasci"', price: 960, unit: 'mjesec', details: 'Obostrano' },
  { id: 'klik-klak', name: 'KLIK KLAK okvir B1', price: 80, unit: 'mjesec', details: 'Zidni aluminijski okvir za postere' },
  { id: 'viseci-baner', name: 'Viseći baner', price: 250, unit: 'mjesec', details: 'Dolazni/odlazni gate i hol' },
  { id: 'staklena-ograda', name: 'Staklena ograda O1-O16', price: 1150, unit: 'mjesec', details: 'Više pozicija' },
];

// Website advertising
export const webAdvertising: PricingItem[] = [
  { id: 'banner-small', name: 'Banner 200x150', price: 150, unit: 'mjesec', details: 'Web stranica aerodroma' },
  { id: 'banner-large', name: 'Banner 1200x200', price: 400, unit: 'mjesec', details: 'Početna strana i red letenja' },
  { id: 'banner-monitor', name: 'Banner na info monitorima', price: 900, unit: 'mjesec', details: '1395x1020 px, prikaz letova' },
];

// Indoor LED Display packages
export const digitalDisplays: PricingItem[] = [
  { id: 'skyimpact', name: 'Paket SkyImpact', price: 1000, unit: 'mjesec', details: '21.600 emitovanja, spot 12 sek' },
  { id: 'cruise', name: 'Paket Cruise', price: 600, unit: 'mjesec', details: '10.800 emitovanja, spot 12 sek' },
  { id: 'takeoff', name: 'Paket Takeoff', price: 400, unit: 'mjesec', details: '8.100 emitovanja, spot 12 sek' },
  { id: 'runway', name: 'Paket Runway', price: 300, unit: 'mjesec', details: '5.400 emitovanja, spot 12 sek' },
  { id: 'standard', name: 'Paket Standard', price: 250, unit: 'mjesec', details: '3.600 emitovanja, video/grafika 8 sek' },
  { id: 'boost', name: 'Paket Boost', price: 400, unit: 'dan', details: 'Kampanja 7 dana, 720 emitovanja' },
];

// Outdoor billboards
export const outdoorBillboards: PricingItem[] = [
  { id: 'billboard-1', name: 'Outdoor bilboard 1/25', price: 350, unit: 'mjesec', details: 'Vanjski bilbordi na lokaciji aerodroma' },
];

// All pricing categories
export const pricingCategories: PricingCategory[] = [
  {
    id: 'indoor',
    title: 'Indoor oglašavanje',
    description: 'Reklamne pozicije unutar putničkog terminala',
    icon: 'building',
    items: indoorAdvertising,
  },
  {
    id: 'digital',
    title: 'LED Display paketi',
    description: 'Digitalni ekrani sa dinamičnim sadržajem',
    icon: 'monitor',
    items: digitalDisplays,
  },
  {
    id: 'web',
    title: 'Web oglašavanje',
    description: 'Banneri na www.tuzla-airport.ba',
    icon: 'globe',
    items: webAdvertising,
  },
  {
    id: 'outdoor',
    title: 'Outdoor bilbordi',
    description: 'Vanjski reklamni panoi',
    icon: 'signpost',
    items: outdoorBillboards,
  },
];

export const advertisingPositions: AdvertisingPosition[] = [
  {
    id: 'wall-format',
    title: 'Veliki zidni format',
    description: 'Dominantna pozicija u prostoru dolazaka i odlazaka. Maksimalna vidljivost za vaš brend.',
    dimensions: '300 x 200 cm',
    location: 'Hala dolazaka / odlazaka',
    available: true,
    image: '/images/advertising/wall-format.jpg',
  },
  {
    id: 'totem',
    title: 'Totem i vertikalni format',
    description: 'Samostojeći reklamni element na strateškim lokacijama unutar terminala.',
    dimensions: '200 x 80 cm',
    location: 'Terminal',
    available: true,
    image: '/images/advertising/totem.jpg',
  },
  {
    id: 'digital',
    title: 'Digitalni ekrani',
    description: 'Dinamični sadržaj na LED ekranima. Mogućnost rotacije više oglašivača.',
    dimensions: 'Full HD / 4K',
    location: 'Check-in zona',
    available: false,
    image: '/images/advertising/digital.jpg',
  },
];

export const processSteps: ProcessStep[] = [
  {
    number: '01',
    title: 'Pošaljite upit',
    description: 'Kontaktirajte nas putem forme ili direktno telefonom.',
  },
  {
    number: '02',
    title: 'Dobijate prijedlog',
    description: 'Šaljemo vam detaljnu ponudu sa cijenama i dostupnosti.',
  },
  {
    number: '03',
    title: 'Dostavljate materijal',
    description: 'Pripremite vizuale prema našim specifikacijama.',
  },
  {
    number: '04',
    title: 'Kampanja počinje',
    description: 'Vaš brend postaje vidljiv hiljadama putnika.',
  },
];

export const benefits: BenefitItem[] = [
  {
    icon: 'globe',
    title: 'Međunarodna publika',
    description: 'Dosegnite putnike iz cijele Evrope i šire. Aerodrom godišnje opsluži preko 500.000 putnika.',
  },
  {
    icon: 'eye',
    title: 'Visoka uočljivost',
    description: 'Strateški pozicionirani oglasi na mjestima gdje putnici provode najviše vremena.',
  },
  {
    icon: 'layout',
    title: 'Fleksibilni formati',
    description: 'Od velikih zidnih formata do digitalnih ekrana - prilagodite format vašoj kampanji.',
  },
];
