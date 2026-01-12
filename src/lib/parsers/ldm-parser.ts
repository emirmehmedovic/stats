/**
 * LDM (Load Message) Parser
 *
 * Parsira LDM poruke i izvlači podatke o letu, putnicima i prtljagu.
 *
 * Primer LDM poruke:
 * LDM
 * W64241/12.9HWNL.239Y.2/5
 * -MST.128/70/19/9.T1051.1/0.2/0.3/1051.4/0.5/0.PAX/217.PAD/0/0
 * SI
 * B/70/1051
 *
 * Format:
 * - Broj leta: W64241
 * - Registracija: 9HWNL
 * - Kapacitet: 239Y (239 sjedišta)
 * - Male putnici: 128
 * - Female putnici: 70
 * - Djeca: 19
 * - Infanti: 9
 * - Ukupno putnika (PAX): 217
 * - Broj prtljaga (B): 70
 * - Kilogrami prtljaga: 1051
 */

export interface LdmData {
  flightNumber: string | null;
  registration: string | null;
  capacity: number | null;
  male: number | null;
  female: number | null;
  children: number | null;
  infants: number | null;
  totalPassengers: number | null;
  baggageCount: number | null;
  baggageWeight: number | null;
}

/**
 * Parsira LDM poruku i vraća strukturirane podatke
 * @param ldmMessage - LDM poruka (može biti upload ili paste)
 * @returns LdmData objekat sa parsiranim podacima
 */
export function parseLdmMessage(ldmMessage: string): LdmData {
  const result: LdmData = {
    flightNumber: null,
    registration: null,
    capacity: null,
    male: null,
    female: null,
    children: null,
    infants: null,
    totalPassengers: null,
    baggageCount: null,
    baggageWeight: null,
  };

  if (!ldmMessage || ldmMessage.trim() === '') {
    return result;
  }

  // Ukloni BOM (Byte Order Mark) ako postoji
  let cleanMessage = ldmMessage;
  if (cleanMessage.charCodeAt(0) === 0xFEFF) {
    cleanMessage = cleanMessage.substring(1);
  }

  // Normalizuj poruku - ukloni višestruke whitespace i linije
  const normalized = cleanMessage
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\u0000/g, '') // Ukloni null karaktere
    .replace(/\uFEFF/g, '') // Ukloni BOM
    .trim();

  const lines = normalized.split('\n').map(line => line.trim()).filter(Boolean);

  console.log('LDM Parser - Lines:', lines); // Debug log

  try {
    // Pronađi liniju sa flight info (obično 2. linija ili linija koja sadrži '/')
    const flightInfoLine = lines.find(line => line.includes('/') && line.includes('.'));

    if (flightInfoLine) {
      // Parse flight info: W64241/12.9HWNL.239Y.2/5
      // Pattern: <FLIGHT_NUMBER>/<DAY>.<REGISTRATION>.<CAPACITY>Y.<REST>
      const flightMatch = flightInfoLine.match(/([A-Z0-9]+)\/\d+\.([A-Z0-9]+)\.(\d+)Y/i);
      if (flightMatch) {
        result.flightNumber = flightMatch[1];
        result.registration = flightMatch[2];
        result.capacity = parseInt(flightMatch[3], 10);
      }
    }

    // Pronađi liniju sa passenger info (obično linija koja počinje sa '-XXX')
    const passengerInfoLine = lines.find(line =>
      /-?[A-Z]{3}\.\d+\/\d+\/\d+\/\d+/.test(line)
    );

    if (passengerInfoLine) {
      // Parse passenger breakdown: -TZL.14/20/3/0.T173...PAX/37
      // Pattern: -XXX.<MALE>/<FEMALE>/<CHILDREN>/<INFANTS>...PAX/<TOTAL_PAX>

      // Extract breakdown: 128/70/19/9
      const breakdownMatch = passengerInfoLine.match(/[A-Z]{3}\.(\d+)\/(\d+)\/(\d+)\/(\d+)/);
      if (breakdownMatch) {
        result.male = parseInt(breakdownMatch[1], 10);
        result.female = parseInt(breakdownMatch[2], 10);
        result.children = parseInt(breakdownMatch[3], 10);
        result.infants = parseInt(breakdownMatch[4], 10);
      }

      // Extract total passengers from PAX field
      const paxMatch = passengerInfoLine.match(/PAX\/(\d+)/);
      if (paxMatch) {
        result.totalPassengers = parseInt(paxMatch[1], 10);
      }
    }

    // Pronađi liniju sa baggage info
    // Baggage može biti:
    // 1. Na zasebnoj liniji: "B/70/1051"
    // 2. Na istoj liniji sa SI: "SI B/70/1051"
    // 3. Bilo gdje u poruci: "...B/70/1051..."
    let baggageInfoLine = lines.find(line => line.startsWith('B/') || line.includes(' B/'));

    // Ako nije nađena u linijama, pretraži cijelu poruku
    if (!baggageInfoLine) {
      const allText = lines.join(' ');
      if (allText.includes('B/')) {
        baggageInfoLine = allText;
      }
    }

    if (baggageInfoLine) {
      // Parse baggage: B/70/1051
      // Pattern: B/<COUNT>/<WEIGHT>
      const baggageMatch = baggageInfoLine.match(/B\/(\d+)\/(\d+)/);
      if (baggageMatch) {
        result.baggageCount = parseInt(baggageMatch[1], 10);
        result.baggageWeight = parseInt(baggageMatch[2], 10);
      }
    }
  } catch (error) {
    console.error('Error parsing LDM message:', error);
  }

  return result;
}

/**
 * Validira da li su podaci iz LDM poruke kompletni
 * @param data - LdmData objekat
 * @returns true ako su osnovni podaci prisutni
 */
export function isValidLdmData(data: LdmData): boolean {
  // Makar broj leta ili registracija + neki passenger data
  const hasFlightInfo = data.flightNumber !== null || data.registration !== null;
  const hasPassengerData = data.totalPassengers !== null || data.male !== null || data.female !== null;

  return hasFlightInfo && hasPassengerData;
}

/**
 * Formatuje LDM podatke za prikaz
 * @param data - LdmData objekat
 * @returns Formatirani string sa podacima
 */
export function formatLdmData(data: LdmData): string {
  const parts: string[] = [];

  if (data.flightNumber) parts.push(`Let: ${data.flightNumber}`);
  if (data.registration) parts.push(`Registracija: ${data.registration}`);
  if (data.capacity) parts.push(`Kapacitet: ${data.capacity}`);
  if (data.totalPassengers !== null) parts.push(`Putnici: ${data.totalPassengers}`);
  if (data.male !== null) parts.push(`Muški: ${data.male}`);
  if (data.female !== null) parts.push(`Ženski: ${data.female}`);
  if (data.children !== null) parts.push(`Djeca: ${data.children}`);
  if (data.infants !== null) parts.push(`Bebe: ${data.infants}`);
  if (data.baggageCount !== null) parts.push(`Broj prtljaga: ${data.baggageCount}`);
  if (data.baggageWeight !== null) parts.push(`Prtljag: ${data.baggageWeight} kg`);

  return parts.join(' | ');
}
