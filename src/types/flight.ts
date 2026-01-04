import { Flight, Airline, AircraftType, Airport, OperationType } from '@prisma/client';

export type FlightWithRelations = Flight & {
  airline: Airline;
  aircraftType: AircraftType;
  arrivalAirport?: Airport | null;
  departureAirport?: Airport | null;
};

export interface FlightsResponse {
  success: boolean;
  data: FlightWithRelations[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface FlightFilters {
  page?: number;
  limit?: number;
  search?: string;
  airlineId?: string;
  dateFrom?: string;
  dateTo?: string;
  route?: string;
  operationType?: OperationType['code'];
}
