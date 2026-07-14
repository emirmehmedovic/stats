# Mjesečni raspored letova - PDF Export

## Pregled

Funkcionalnost za eksport mjesečnog rasporeda letova u kompaktnom PDF formatu.

## Karakteristike

### Layout
- **Orjentacija**: Landscape (A4)
- **Grid format**: 7 kolona × 3 reda = 21 dan po stranici
- **Broj stranica**: 2 stranice za mjesece sa 30-31 dan

### Prikaz dana
Svaki dan prikazan je kao kompaktna kartica koja sadrži:
- **Header**: Broj dana i skraćeni naziv (npr. "15 PON")
- **Letovi**: Lista letova za taj dan sa:
  - Logotip aviokompanije (ili IATA/ICAO kod)
  - Destinacija (ekstraktovana iz rute)
  - Vremena polijetanja i slijetanja
  - Status (OTKAZANO ako je cancelled)

### Logotipi
- Logotipi se automatski konvertuju u base64 format za kompatibilnost sa PDF renderovanjem
- Ako logotip nije dostupan, prikazuje se IATA ili ICAO kod aviokompanije

## Implementacija

### Komponente

1. **MonthlySchedulePDF** (`/src/components/reports/MonthlySchedulePDF.tsx`)
   - React PDF komponenta za generiranje dokumenta
   - Kompaktni grid layout sa stilovima
   - Formatiranje datuma i vremena

2. **MonthlyScheduleExport** (`/src/components/reports/MonthlyScheduleExport.tsx`)
   - UI modal za izbor mjeseca i godine
   - Download funkcionalnost

3. **API Endpoint** (`/src/app/api/reports/monthly-schedule/route.ts`)
   - GET endpoint koji prihvaća `month` i `year` parametre
   - Preuzima letove iz baze
   - Konvertuje logotipe u base64
   - Grupira letove po danima
   - Generiše i vraća PDF

### Logo Proxy
Logo proxy endpoint (`/src/app/api/proxy/airline-logo/route.ts`) konvertuje eksterne URL-ove logotipa u base64 format za kompatibilnost sa @react-pdf/renderer.

## Korištenje

### UI
1. Kliknite na "Mjesečni PDF" dugme na `/flights` stranici
2. Izaberite mjesec i godinu
3. Kliknite "Preuzmi PDF"
4. PDF se automatski preuzima kao `raspored-{mjesec}-{godina}.pdf`

### API
```
GET /api/reports/monthly-schedule?month=6&year=2026
```

Parametri:
- `month`: Mjesec (1-12)
- `year`: Godina (2000-2100)

Response: PDF file kao attachment

## Biblioteke

- **@react-pdf/renderer**: React komponente za PDF generiranje
- **Next.js API Routes**: Server-side PDF generiranje
- **Prisma**: Preuzimanje podataka iz baze

## Stilizacija

Kompaktan dizajn sa:
- Plavi header za svaki dan (#2563eb)
- Borderovi i zaobljeni uglovi
- Mali fontovi (6-8pt) za maksimalnu kompaktnost
- Alternating row boje za bolje čitanje

## Optimizacije

- Caching logotipa tokom generiranja (svaki logotip se preuzima samo jednom)
- Grupiranje dana po stranicama (21 dan po stranici)
- Base64 konverzija logotipa za offline PDF kompatibilnost
