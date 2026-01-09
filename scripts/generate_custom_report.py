#!/usr/bin/env python3
"""
Custom Advanced Report Generator

Generiše prilagođeni izvještaj sa naprednim filterima:
- Tip saobraćaja (multi-select)
- Aviokompanije (multi-select)
- Rute (multi-select)
- Period (od-do)
- Tip putnika (odlazni/dolazni/svi/bebe)
"""

import sys
import os
import json
from pathlib import Path
from datetime import datetime
import psycopg2
from psycopg2.extras import RealDictCursor
import openpyxl
from openpyxl.styles import Font, Alignment, Border, Side, PatternFill

SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
OUTPUT_DIR = PROJECT_ROOT / "izvještaji" / "generated"


def get_db_connection():
    """Konekcija na PostgreSQL bazu"""
    DATABASE_URL = os.getenv("DATABASE_URL")
    if not DATABASE_URL:
        raise ValueError("DATABASE_URL environment variable not set")
    return psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)


def get_flight_data(date_from, date_to, operation_types, airlines, routes):
    """
    Povuči letove sa filterima
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    # Build WHERE conditions
    where_conditions = ["f.date >= %s", "f.date <= %s"]
    params = [date_from, date_to]

    if operation_types:
        placeholders = ','.join(['%s'] * len(operation_types))
        where_conditions.append(f'f."operationTypeId" IN ({placeholders})')
        params.extend(operation_types)

    if airlines:
        placeholders = ','.join(['%s'] * len(airlines))
        where_conditions.append(f'f."airlineId" IN ({placeholders})')
        params.extend(airlines)

    if routes:
        placeholders = ','.join(['%s'] * len(routes))
        where_conditions.append(f'f.route IN ({placeholders})')
        params.extend(routes)

    where_clause = " AND ".join(where_conditions)

    query = f"""
        SELECT
            f.id,
            f.date,
            f.route,
            f.registration,
            
            -- Airline
            a.name as airline_name,
            a."icaoCode" as airline_icao,
            
            -- Aircraft Type
            at.model as aircraft_model,
            
            -- Operation Type
            ot.name as operation_type_name,
            ot.code as operation_type_code,
            
            -- Arrival info
            f."arrivalFlightNumber",
            f."arrivalScheduledTime",
            f."arrivalActualTime",
            f."arrivalPassengers",
            f."arrivalMalePassengers",
            f."arrivalFemalePassengers",
            f."arrivalChildren",
            f."arrivalInfants",
            
            -- Departure info
            f."departureFlightNumber",
            f."departureScheduledTime",
            f."departureActualTime",
            f."departurePassengers",
            f."departureMalePassengers",
            f."departureFemalePassengers",
            f."departureChildren",
            f."departureInfants"
            
        FROM "Flight" f
        LEFT JOIN "Airline" a ON f."airlineId" = a.id
        LEFT JOIN "AircraftType" at ON f."aircraftTypeId" = at.id
        LEFT JOIN "OperationType" ot ON f."operationTypeId" = ot.id
        WHERE {where_clause}
        ORDER BY f.date ASC, f."departureScheduledTime" ASC
    """

    cursor.execute(query, params)
    flights = cursor.fetchall()
    cursor.close()
    conn.close()

    return flights


def format_datetime(dt):
    """Format datetime za prikaz"""
    if not dt:
        return "-"
    if isinstance(dt, str):
        dt = datetime.fromisoformat(dt.replace('Z', '+00:00'))
    return dt.strftime("%d.%m.%Y %H:%M")


def format_date(dt):
    """Format date za prikaz"""
    if not dt:
        return "-"
    if isinstance(dt, str):
        dt = datetime.fromisoformat(dt.split('T')[0])
    return dt.strftime("%d.%m.%Y")


def create_excel_report(flights, passenger_type, date_from, date_to):
    """
    Kreira Excel izvještaj sa filteriranim podacima
    """
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Custom izvještaj"

    # Styles
    header_font = Font(bold=True, color="FFFFFF", size=11)
    header_fill = PatternFill(start_color="0F172A", end_color="0F172A", fill_type="solid")
    header_alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
    
    thin_border = Border(
        left=Side(style='thin'),
        right=Side(style='thin'),
        top=Side(style='thin'),
        bottom=Side(style='thin')
    )

    # Define columns based on passenger type
    base_headers = ["Datum", "Aviokompanija", "Tip aviona", "Registracija", "Ruta", "Tip operacije"]
    
    if passenger_type == "departure":
        headers = base_headers + [
            "Broj leta (odlazak)", "Planirano vrijeme", "Stvarno vrijeme",
            "Putnici", "Muškarci", "Žene", "Djeca", "Bebe"
        ]
    elif passenger_type == "arrival":
        headers = base_headers + [
            "Broj leta (dolazak)", "Planirano vrijeme", "Stvarno vrijeme",
            "Putnici", "Muškarci", "Žene", "Djeca", "Bebe"
        ]
    elif passenger_type == "infants":
        headers = base_headers + [
            "Broj leta (dolazak)", "Broj leta (odlazak)",
            "Bebe (dolazak)", "Bebe (odlazak)", "Ukupno beba"
        ]
    else:  # all
        headers = base_headers + [
            "Broj leta (dolazak)", "Putnici (dolazak)",
            "Broj leta (odlazak)", "Putnici (odlazak)",
            "Ukupno putnika"
        ]

    # Write headers
    for col_idx, header in enumerate(headers, start=1):
        cell = ws.cell(row=1, column=col_idx, value=header)
        cell.font = header_font
        cell.fill = header_fill
        cell.alignment = header_alignment
        cell.border = thin_border

    # Set column widths
    column_widths = [12, 25, 15, 12, 15, 15] + [18] * (len(headers) - 6)
    for col_idx, width in enumerate(column_widths, start=1):
        ws.column_dimensions[openpyxl.utils.get_column_letter(col_idx)].width = width

    # Write data rows
    row_idx = 2
    total_passengers = 0
    total_infants = 0

    for flight in flights:
        base_data = [
            format_date(flight['date']),
            flight['airline_name'] or "-",
            flight['aircraft_model'] or "-",
            flight['registration'] or "-",
            flight['route'] or "-",
            flight['operation_type_name'] or "-"
        ]

        if passenger_type == "departure":
            passenger_data = [
                flight['departureFlightNumber'] or "-",
                format_datetime(flight['departureScheduledTime']),
                format_datetime(flight['departureActualTime']),
                flight['departurePassengers'] or 0,
                flight['departureMalePassengers'] or 0,
                flight['departureFemalePassengers'] or 0,
                flight['departureChildren'] or 0,
                flight['departureInfants'] or 0
            ]
            total_passengers += flight['departurePassengers'] or 0
        elif passenger_type == "arrival":
            passenger_data = [
                flight['arrivalFlightNumber'] or "-",
                format_datetime(flight['arrivalScheduledTime']),
                format_datetime(flight['arrivalActualTime']),
                flight['arrivalPassengers'] or 0,
                flight['arrivalMalePassengers'] or 0,
                flight['arrivalFemalePassengers'] or 0,
                flight['arrivalChildren'] or 0,
                flight['arrivalInfants'] or 0
            ]
            total_passengers += flight['arrivalPassengers'] or 0
        elif passenger_type == "infants":
            arr_infants = flight['arrivalInfants'] or 0
            dep_infants = flight['departureInfants'] or 0
            passenger_data = [
                flight['arrivalFlightNumber'] or "-",
                flight['departureFlightNumber'] or "-",
                arr_infants,
                dep_infants,
                arr_infants + dep_infants
            ]
            total_infants += arr_infants + dep_infants
        else:  # all
            arr_pax = flight['arrivalPassengers'] or 0
            dep_pax = flight['departurePassengers'] or 0
            passenger_data = [
                flight['arrivalFlightNumber'] or "-",
                arr_pax,
                flight['departureFlightNumber'] or "-",
                dep_pax,
                arr_pax + dep_pax
            ]
            total_passengers += arr_pax + dep_pax

        row_data = base_data + passenger_data

        for col_idx, value in enumerate(row_data, start=1):
            cell = ws.cell(row=row_idx, column=col_idx, value=value)
            cell.border = thin_border
            if col_idx > 6:  # Numeric columns
                cell.alignment = Alignment(horizontal="center")

        row_idx += 1

    # Create comprehensive summary table
    row_idx += 2
    
    # Summary header
    summary_header_fill = PatternFill(start_color="F59E0B", end_color="F59E0B", fill_type="solid")
    summary_title_row = row_idx
    for col in range(1, len(headers) + 1):
        cell = ws.cell(row=summary_title_row, column=col)
        if col == 1:
            cell.value = "SAŽETAK IZVJEŠTAJA"
        cell.font = Font(bold=True, size=14, color="FFFFFF")
        cell.fill = summary_header_fill
        cell.alignment = Alignment(horizontal="center", vertical="center")
        cell.border = thin_border
    ws.merge_cells(start_row=summary_title_row, start_column=1, end_row=summary_title_row, end_column=len(headers))
    row_idx += 1
    
    # Period info
    period_cell = ws.cell(row=row_idx, column=1, value="Period:")
    period_cell.font = Font(bold=True)
    period_cell.border = thin_border
    
    for col in range(2, 5):
        cell = ws.cell(row=row_idx, column=col)
        if col == 2:
            cell.value = f"{date_from} do {date_to}"
        cell.border = thin_border
    ws.merge_cells(start_row=row_idx, start_column=2, end_row=row_idx, end_column=4)
    row_idx += 1
    
    # Basic statistics
    stats_fill = PatternFill(start_color="FEF3C7", end_color="FEF3C7", fill_type="solid")
    
    # Total flights
    flights_label = ws.cell(row=row_idx, column=1, value="Ukupno letova:")
    flights_label.font = Font(bold=True)
    flights_label.fill = stats_fill
    flights_value = ws.cell(row=row_idx, column=2, value=len(flights))
    flights_value.font = Font(bold=True, size=12)
    flights_value.fill = stats_fill
    flights_value.alignment = Alignment(horizontal="center")
    row_idx += 1
    
    # Total passengers/infants
    if passenger_type == "infants":
        pax_label = ws.cell(row=row_idx, column=1, value="Ukupno beba:")
        pax_label.font = Font(bold=True)
        pax_label.fill = stats_fill
        pax_value = ws.cell(row=row_idx, column=2, value=total_infants)
        pax_value.font = Font(bold=True, size=12, color="D97706")
        pax_value.fill = stats_fill
        pax_value.alignment = Alignment(horizontal="center")
    else:
        pax_label = ws.cell(row=row_idx, column=1, value="Ukupno putnika:")
        pax_label.font = Font(bold=True)
        pax_label.fill = stats_fill
        pax_value = ws.cell(row=row_idx, column=2, value=total_passengers)
        pax_value.font = Font(bold=True, size=12, color="D97706")
        pax_value.fill = stats_fill
        pax_value.alignment = Alignment(horizontal="center")
    row_idx += 1
    
    # Average passengers per flight
    if passenger_type != "infants" and len(flights) > 0:
        avg_label = ws.cell(row=row_idx, column=1, value="Prosječno putnika po letu:")
        avg_label.font = Font(bold=True)
        avg_label.fill = stats_fill
        avg_value = ws.cell(row=row_idx, column=2, value=round(total_passengers / len(flights), 1))
        avg_value.font = Font(bold=True)
        avg_value.fill = stats_fill
        avg_value.alignment = Alignment(horizontal="center")
        row_idx += 1
    
    row_idx += 1
    
    # Breakdown by airline
    airline_counts = {}
    airline_passengers = {}
    for flight in flights:
        airline = flight['airline_name'] or "Nepoznato"
        airline_counts[airline] = airline_counts.get(airline, 0) + 1
        
        if passenger_type == "departure":
            airline_passengers[airline] = airline_passengers.get(airline, 0) + (flight['departurePassengers'] or 0)
        elif passenger_type == "arrival":
            airline_passengers[airline] = airline_passengers.get(airline, 0) + (flight['arrivalPassengers'] or 0)
        elif passenger_type == "all":
            airline_passengers[airline] = airline_passengers.get(airline, 0) + (flight['arrivalPassengers'] or 0) + (flight['departurePassengers'] or 0)
    
    if airline_counts:
        breakdown_fill = PatternFill(start_color="64748B", end_color="64748B", fill_type="solid")
        for col in range(1, 5):
            cell = ws.cell(row=row_idx, column=col)
            if col == 1:
                cell.value = "PREGLED PO AVIOKOMPANIJAMA"
            cell.font = Font(bold=True, size=11, color="FFFFFF")
            cell.fill = breakdown_fill
            cell.alignment = Alignment(horizontal="center")
            cell.border = thin_border
        ws.merge_cells(start_row=row_idx, start_column=1, end_row=row_idx, end_column=4)
        row_idx += 1
        
        # Headers
        ws.cell(row=row_idx, column=1, value="Aviokompanija").font = Font(bold=True)
        ws.cell(row=row_idx, column=2, value="Broj letova").font = Font(bold=True)
        if passenger_type != "infants":
            ws.cell(row=row_idx, column=3, value="Putnici").font = Font(bold=True)
            ws.cell(row=row_idx, column=4, value="Prosječno").font = Font(bold=True)
        row_idx += 1
        
        for airline in sorted(airline_counts.keys()):
            ws.cell(row=row_idx, column=1, value=airline)
            ws.cell(row=row_idx, column=2, value=airline_counts[airline]).alignment = Alignment(horizontal="center")
            if passenger_type != "infants":
                ws.cell(row=row_idx, column=3, value=airline_passengers.get(airline, 0)).alignment = Alignment(horizontal="center")
                avg = round(airline_passengers.get(airline, 0) / airline_counts[airline], 1) if airline_counts[airline] > 0 else 0
                ws.cell(row=row_idx, column=4, value=avg).alignment = Alignment(horizontal="center")
            row_idx += 1
        
        row_idx += 1
    
    # Breakdown by route (top 10)
    route_counts = {}
    route_passengers = {}
    for flight in flights:
        route = flight['route'] or "Nepoznato"
        route_counts[route] = route_counts.get(route, 0) + 1
        
        if passenger_type == "departure":
            route_passengers[route] = route_passengers.get(route, 0) + (flight['departurePassengers'] or 0)
        elif passenger_type == "arrival":
            route_passengers[route] = route_passengers.get(route, 0) + (flight['arrivalPassengers'] or 0)
        elif passenger_type == "all":
            route_passengers[route] = route_passengers.get(route, 0) + (flight['arrivalPassengers'] or 0) + (flight['departurePassengers'] or 0)
    
    if route_counts:
        route_fill = PatternFill(start_color="64748B", end_color="64748B", fill_type="solid")
        for col in range(1, 5):
            cell = ws.cell(row=row_idx, column=col)
            if col == 1:
                cell.value = "TOP 10 RUTA"
            cell.font = Font(bold=True, size=11, color="FFFFFF")
            cell.fill = route_fill
            cell.alignment = Alignment(horizontal="center")
            cell.border = thin_border
        ws.merge_cells(start_row=row_idx, start_column=1, end_row=row_idx, end_column=4)
        row_idx += 1
        
        # Headers
        ws.cell(row=row_idx, column=1, value="Ruta").font = Font(bold=True)
        ws.cell(row=row_idx, column=2, value="Broj letova").font = Font(bold=True)
        if passenger_type != "infants":
            ws.cell(row=row_idx, column=3, value="Putnici").font = Font(bold=True)
            ws.cell(row=row_idx, column=4, value="Prosječno").font = Font(bold=True)
        row_idx += 1
        
        # Sort by flight count and take top 10
        top_routes = sorted(route_counts.items(), key=lambda x: x[1], reverse=True)[:10]
        for route, count in top_routes:
            ws.cell(row=row_idx, column=1, value=route)
            ws.cell(row=row_idx, column=2, value=count).alignment = Alignment(horizontal="center")
            if passenger_type != "infants":
                ws.cell(row=row_idx, column=3, value=route_passengers.get(route, 0)).alignment = Alignment(horizontal="center")
                avg = round(route_passengers.get(route, 0) / count, 1) if count > 0 else 0
                ws.cell(row=row_idx, column=4, value=avg).alignment = Alignment(horizontal="center")
            row_idx += 1
        
        row_idx += 1
    
    # Breakdown by operation type
    optype_counts = {}
    optype_passengers = {}
    for flight in flights:
        optype = flight['operation_type_name'] or "Nepoznato"
        optype_counts[optype] = optype_counts.get(optype, 0) + 1
        
        if passenger_type == "departure":
            optype_passengers[optype] = optype_passengers.get(optype, 0) + (flight['departurePassengers'] or 0)
        elif passenger_type == "arrival":
            optype_passengers[optype] = optype_passengers.get(optype, 0) + (flight['arrivalPassengers'] or 0)
        elif passenger_type == "all":
            optype_passengers[optype] = optype_passengers.get(optype, 0) + (flight['arrivalPassengers'] or 0) + (flight['departurePassengers'] or 0)
    
    if optype_counts:
        optype_fill = PatternFill(start_color="64748B", end_color="64748B", fill_type="solid")
        for col in range(1, 5):
            cell = ws.cell(row=row_idx, column=col)
            if col == 1:
                cell.value = "PREGLED PO TIPU SAOBRAĆAJA"
            cell.font = Font(bold=True, size=11, color="FFFFFF")
            cell.fill = optype_fill
            cell.alignment = Alignment(horizontal="center")
            cell.border = thin_border
        ws.merge_cells(start_row=row_idx, start_column=1, end_row=row_idx, end_column=4)
        row_idx += 1
        
        # Headers
        ws.cell(row=row_idx, column=1, value="Tip saobraćaja").font = Font(bold=True)
        ws.cell(row=row_idx, column=2, value="Broj letova").font = Font(bold=True)
        if passenger_type != "infants":
            ws.cell(row=row_idx, column=3, value="Putnici").font = Font(bold=True)
            ws.cell(row=row_idx, column=4, value="Prosječno").font = Font(bold=True)
        row_idx += 1
        
        for optype in sorted(optype_counts.keys()):
            ws.cell(row=row_idx, column=1, value=optype)
            ws.cell(row=row_idx, column=2, value=optype_counts[optype]).alignment = Alignment(horizontal="center")
            if passenger_type != "infants":
                ws.cell(row=row_idx, column=3, value=optype_passengers.get(optype, 0)).alignment = Alignment(horizontal="center")
                avg = round(optype_passengers.get(optype, 0) / optype_counts[optype], 1) if optype_counts[optype] > 0 else 0
                ws.cell(row=row_idx, column=4, value=avg).alignment = Alignment(horizontal="center")
            row_idx += 1

    # Set row height for header
    ws.row_dimensions[1].height = 30

    return wb


def main():
    """Main function"""
    if len(sys.argv) < 2:
        print(json.dumps({
            "success": False,
            "error": "Missing filters argument"
        }))
        sys.exit(1)

    try:
        # Parse filters from command line argument
        filters = json.loads(sys.argv[1])
        
        date_from = filters.get('dateFrom')
        date_to = filters.get('dateTo')
        operation_types = filters.get('operationTypes', [])
        airlines = filters.get('airlines', [])
        routes = filters.get('routes', [])
        passenger_type = filters.get('passengerType', 'all')

        if not date_from or not date_to:
            print(json.dumps({
                "success": False,
                "error": "dateFrom and dateTo are required"
            }))
            sys.exit(1)

        # Fetch data
        flights = get_flight_data(date_from, date_to, operation_types, airlines, routes)

        # Generate Excel
        wb = create_excel_report(flights, passenger_type, date_from, date_to)

        # Save file
        OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
        timestamp = datetime.now().strftime("%Y%m%d")
        filename = f"Custom_izvjestaj_{timestamp}.xlsx"
        output_path = OUTPUT_DIR / filename

        wb.save(output_path)

        print(json.dumps({
            "success": True,
            "fileName": filename,
            "message": f"Custom izvještaj uspješno generisan ({len(flights)} letova)"
        }))

    except Exception as e:
        print(json.dumps({
            "success": False,
            "error": str(e)
        }))
        sys.exit(1)


if __name__ == "__main__":
    main()
