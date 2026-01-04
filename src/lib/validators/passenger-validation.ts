/**
 * Helper funkcije za validaciju broja putnika
 */

export type PassengerValidationResult = {
  error?: boolean;
  warning?: boolean;
  message?: string;
  requiresConfirmation?: boolean;
};

/**
 * Validira broj putnika u odnosu na kapacitet
 */
export function validatePassengerCount(
  passengers: number | null | undefined,
  capacity: number | null | undefined
): PassengerValidationResult {
  // Ako nema putnika ili kapaciteta, nema validacije
  if (!passengers || !capacity) {
    return {};
  }

  // Pravilo 1: Broj putnika ne može biti veći od kapaciteta
  if (passengers > capacity) {
    return {
      error: true,
      message: `Broj putnika (${passengers}) ne može biti veći od kapaciteta (${capacity})`,
    };
  }

  // Pravilo 2: Broj putnika ne može biti 4-cifren (provjerava se već u Zod validaciji, ali evo i ovdje)
  if (passengers >= 1000) {
    return {
      error: true,
      message: `Broj putnika ne može biti 4-cifren ili veći. Uneseno: ${passengers}`,
    };
  }

  // Pravilo 3: Upozorenje ako je popunjenost manja od 20%
  const loadFactor = (passengers / capacity) * 100;
  if (loadFactor < 20 && passengers > 0) {
    return {
      warning: true,
      message: `Niska popunjenost: ${passengers}/${capacity} putnika (${loadFactor.toFixed(
        1
      )}%). Da li ste sigurni?`,
      requiresConfirmation: true,
    };
  }

  return {};
}

/**
 * Validira da li breakdown putnika odgovara ukupnom broju
 */
export function validatePassengerBreakdown(
  total: number | null | undefined,
  male: number | null | undefined,
  female: number | null | undefined,
  children: number | null | undefined
): PassengerValidationResult {
  // Ako nema breakdown podataka, prihvatamo
  if (!male && !female && !children) {
    return {};
  }

  // Ako ima breakdown, ukupan broj mora biti prisutan
  if (!total) {
    return {};
  }

  const maleCount = male || 0;
  const femaleCount = female || 0;
  const childrenCount = children || 0;
  const sum = maleCount + femaleCount + childrenCount;

  if (sum !== total) {
    return {
      error: true,
      message: `Zbir putnika (M: ${maleCount} + Ž: ${femaleCount} + D: ${childrenCount} = ${sum}) ne odgovara ukupnom broju (${total})`,
    };
  }

  return {};
}

/**
 * Validira sve passenger podatke i vraća sve greške i upozorenja
 */
export function validateAllPassengerData(data: {
  arrivalPassengers?: number | null;
  arrivalMalePassengers?: number | null;
  arrivalFemalePassengers?: number | null;
  arrivalChildren?: number | null;
  arrivalFerryIn?: boolean | null;
  departurePassengers?: number | null;
  departureMalePassengers?: number | null;
  departureFemalePassengers?: number | null;
  departureChildren?: number | null;
  departureFerryOut?: boolean | null;
  availableSeats?: number | null;
}): {
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validacija Arrival putnika
  if (data.arrivalPassengers && !data.arrivalFerryIn) {
    const countValidation = validatePassengerCount(
      data.arrivalPassengers,
      data.availableSeats
    );
    if (countValidation.error) {
      errors.push(`Dolazak: ${countValidation.message}`);
    }
    if (countValidation.warning) {
      warnings.push(`Dolazak: ${countValidation.message}`);
    }

    // Validacija breakdown-a
    const breakdownValidation = validatePassengerBreakdown(
      data.arrivalPassengers,
      data.arrivalMalePassengers,
      data.arrivalFemalePassengers,
      data.arrivalChildren
    );
    if (breakdownValidation.error) {
      errors.push(`Dolazak breakdown: ${breakdownValidation.message}`);
    }
  }

  // Validacija Departure putnika
  if (data.departurePassengers && !data.departureFerryOut) {
    const countValidation = validatePassengerCount(
      data.departurePassengers,
      data.availableSeats
    );
    if (countValidation.error) {
      errors.push(`Odlazak: ${countValidation.message}`);
    }
    if (countValidation.warning) {
      warnings.push(`Odlazak: ${countValidation.message}`);
    }

    // Validacija breakdown-a
    const breakdownValidation = validatePassengerBreakdown(
      data.departurePassengers,
      data.departureMalePassengers,
      data.departureFemalePassengers,
      data.departureChildren
    );
    if (breakdownValidation.error) {
      errors.push(`Odlazak breakdown: ${breakdownValidation.message}`);
    }
  }

  return { errors, warnings };
}
