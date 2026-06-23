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
    const flightInfoLine = lines.find(line => /^[A-Z0-9]+\/\d+\./i.test(line));

    if (flightInfoLine) {
      // Parse flight info: W64241/12.9HWNL.239Y.2/5 or VF272/03.TCJFM.Y189.2/4
      const slashIndex = flightInfoLine.indexOf('/');
      const flightNumber = flightInfoLine.slice(0, slashIndex).trim();
      const rest = flightInfoLine.slice(slashIndex + 1).trim();

      if (flightNumber) {
        result.flightNumber = flightNumber;
      }

      const restNoDay = rest.replace(/^\d+\./, '');
      const tokens = restNoDay.split(/[./]/).filter(Boolean);
      const registrationToken = tokens[0];
      const capacityToken = tokens[1];

      if (registrationToken) {
        result.registration = registrationToken;
      }

      if (capacityToken) {
        const capacityMatch = capacityToken.match(/\d+/);
        if (capacityMatch) {
          result.capacity = parseInt(capacityMatch[0], 10);
        }
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
      // Format može biti:
      // 1. PAX/217 (stari format - broj je ukupno putnika)
      // 2. PAX/0/0/189 (novi format - TREĆI broj je ukupno putnika)
      const paxNewFormatMatch = passengerInfoLine.match(/PAX\/\d+\/\d+\/(\d+)/);
      if (paxNewFormatMatch) {
        // Novi format: PAX/0/0/189 - treći broj je ukupno putnika
        result.totalPassengers = parseInt(paxNewFormatMatch[1], 10);
      } else {
        // Stari format: PAX/217 - direktno ukupno putnika
        const paxOldFormatMatch = passengerInfoLine.match(/PAX\/(\d+)/);
        if (paxOldFormatMatch) {
          result.totalPassengers = parseInt(paxOldFormatMatch[1], 10);
        }
      }
    }

    const allText = lines.join(' ');

    // Pronađi ukupno putnika iz bilo koje linije (fallback)
    if (result.totalPassengers === null) {
      // Prvo pokušaj novi format sa tri broja
      const paxNewFormatMatch = allText.match(/PAX\/\d+\/\d+\/(\d+)/i);
      if (paxNewFormatMatch) {
        result.totalPassengers = parseInt(paxNewFormatMatch[1], 10);
      } else {
        // Stari format sa jednim brojem
        const paxOldFormatMatch = allText.match(/PAX\/(\d+)/i);
        if (paxOldFormatMatch) {
          result.totalPassengers = parseInt(paxOldFormatMatch[1], 10);
        }
      }
    }

    // Pronađi liniju sa baggage info
    // Baggage može biti:
    // 1. Na zasebnoj liniji: "B/70/1051"
    // 2. Na istoj liniji sa SI: "SI B/70/1051"
    // 3. Bilo gdje u poruci: "...B/70/1051..."
    // 4. Alternativno: ".BAGS/20/285"
    // 5. Novi format: "BAG 176/ 2391" (sa razmakom)
    // 6. CHECKED BGG PCS: "CHECKED BGG PCS SAW 3/Y/102"
    let baggageInfoLine = lines.find(line => line.startsWith('B/') || line.includes(' B/') || line.includes('BAGS/'));

    // Ako nije nađena u linijama, pretraži cijelu poruku
    if (!baggageInfoLine) {
      if (allText.includes('B/')) {
        baggageInfoLine = allText;
      }
    }

    if (baggageInfoLine) {
      // Parse baggage - može biti više formata:
      // 1. B/115/1813 - dva broja (komadi/kilogrami) - PEGASUS format
      // 2. B/1405 - jedan broj (samo kilogrami) - AJET format
      const baggageTwoNumbersMatch = baggageInfoLine.match(/B\/(\d+)\/(\d+)/);
      if (baggageTwoNumbersMatch) {
        // Format sa dva broja: B/115/1813
        result.baggageCount = parseInt(baggageTwoNumbersMatch[1], 10);
        result.baggageWeight = parseInt(baggageTwoNumbersMatch[2], 10);
      } else {
        // Format sa jednim brojem: B/1405 (samo težina)
        const baggageOneNumberMatch = baggageInfoLine.match(/B\/(\d+)(?!\/)/);
        if (baggageOneNumberMatch) {
          result.baggageWeight = parseInt(baggageOneNumberMatch[1], 10);
          // Broj komada će biti pronađen kasnije iz CHECKED BGG PCS linije
        }
      }
    }

    if (result.baggageCount === null || result.baggageWeight === null) {
      const bagsMatch = allText.match(/BAGS\/(\d+)\/(\d+)/i);
      if (bagsMatch) {
        result.baggageCount = parseInt(bagsMatch[1], 10);
        result.baggageWeight = parseInt(bagsMatch[2], 10);
      }
    }

    // Format: BAG/119/1799 (BAG sa slash bez razmaka)
    if (result.baggageCount === null || result.baggageWeight === null) {
      const bagSlashMatch = allText.match(/BAG\/(\d+)\/(\d+)/i);
      if (bagSlashMatch) {
        result.baggageCount = parseInt(bagSlashMatch[1], 10);
        result.baggageWeight = parseInt(bagSlashMatch[2], 10);
      }
    }

    // Format: BAG 176/ 2391 (sa razmakom između BAG i brojeva)
    if (result.baggageCount === null || result.baggageWeight === null) {
      const bagSpaceMatch = allText.match(/BAG\s+(\d+)\/\s*(\d+)/i);
      if (bagSpaceMatch) {
        result.baggageCount = parseInt(bagSpaceMatch[1], 10);
        result.baggageWeight = parseInt(bagSpaceMatch[2], 10);
      }
    }

    if (result.baggageCount === null) {
      const checkedMatch = allText.match(
        /CHECKED\s+(?:BAGGAGE|BGG)\s+(?:PIECES|PCS)\s+[A-Z]{3}\s+\d+\/Y\/(\d+)/i
      );
      if (checkedMatch) {
        result.baggageCount = parseInt(checkedMatch[1], 10);
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
