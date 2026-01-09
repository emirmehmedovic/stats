#!/usr/bin/env python3
"""
Wizz Air Daily Performance Table Generator

Generiše mjesečni izvještaj performansi za Wizz Air sa jednim sheet-om po danu.
Times are converted from Europe/Sarajevo (local) to UTC.
"""

import sys
import os
import calendar
from pathlib import Path
from datetime import datetime, timedelta
import psycopg2
from psycopg2.extras import RealDictCursor
import openpyxl
from openpyxl.styles import Font, Alignment, Border, Side, PatternFill
import pytz

# Putanja
SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
OUTPUT_DIR = PROJECT_ROOT / "izvještaji" / "generated"

# Nazivi mjeseci
MONTH_NAMES = {
    1: "Januar", 2: "Februar", 3: "Mart", 4: "April",
    5: "Maj", 6: "Juni", 7: "Juli", 8: "Avgust",
    9: "Septembar", 10: "Oktobar", 11: "Novembar", 12: "Decembar"
}

# Timezone setup
SARAJEVO_TZ = pytz.timezone('Europe/Sarajevo')
UTC_TZ = pytz.utc


def get_db_connection():
    """Konekcija na PostgreSQL bazu"""
    DATABASE_URL = os.getenv("DATABASE_URL")
    if not DATABASE_URL:
        raise ValueError("DATABASE_URL environment variable not set")

    return psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)


def create_merged_cell(ws, row, start_col, end_col, value, font=None, fill=None, alignment=None, border=None):
    """
    Helper function to properly create merged cells with consistent formatting.
    Applies formatting to ALL cells in the range before merging to avoid Excel corruption.
    """
    # Convert column letters to numbers if needed
    if isinstance(start_col, str):
        start_col = openpyxl.utils.column_index_from_string(start_col)
    if isinstance(end_col, str):
        end_col = openpyxl.utils.column_index_from_string(end_col)
    
    for col in range(start_col, end_col + 1):
        cell = ws.cell(row=row, column=col)
        if col == start_col and value is not None:
            cell.value = value
        if font:
            cell.font = font
        if fill:
            cell.fill = fill
        if alignment:
            cell.alignment = alignment
        if border:
            cell.border = border
    
    if start_col != end_col:
        ws.merge_cells(start_row=row, start_column=start_col, end_row=row, end_column=end_col)


def convert_to_utc(local_time, date):
    """
    Convert local time (Europe/Sarajevo) to UTC.

    Args:
        local_time: datetime.time object or datetime object
        date: datetime.date object for the day

    Returns:
        datetime object in UTC, or None if input is None
    """
    if local_time is None:
        return None

    # If it's a time object, combine with date
    if hasattr(local_time, 'hour') and not hasattr(local_time, 'year'):
        # It's a time object
        local_dt = datetime.combine(date, local_time)
    else:
        # It's already a datetime
        local_dt = local_time

    # Localize to Sarajevo timezone
    local_dt = SARAJEVO_TZ.localize(local_dt)

    # Convert to UTC
    utc_dt = local_dt.astimezone(UTC_TZ)

    return utc_dt


def format_time_utc(dt):
    """Format datetime as HH:MM for display"""
    if dt is None:
        return ""
    return dt.strftime('%H:%M')


def calculate_delay_minutes(scheduled, actual):
    """
    Calculate delay in minutes between scheduled and actual time.
    Both times should be datetime objects.

    Returns: minutes (int) or None if cannot calculate
    """
    if scheduled is None or actual is None:
        return None

    delay = actual - scheduled
    minutes = int(delay.total_seconds() / 60)

    # Only return positive delays (negative means early)
    return minutes if minutes > 0 else 0


def get_flight_data(year: int, month: int):
    """
    Povuči sve Wizz Air letove za zadati mjesec
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    # Datum početka i kraja mjeseca
    first_day = f"{year}-{month:02d}-01"
    last_day = calendar.monthrange(year, month)[1]
    last_date = f"{year}-{month:02d}-{last_day:02d}"

    query = """
        SELECT
            f.id,
            f.date,
            f.route,
            f.registration,

            -- Airline
            a.name as airline_name,
            a."icaoCode" as airline_icao,
            a."iataCode" as airline_iata,

            -- Departure info
            f."departureFlightNumber",
            f."departureScheduledTime",
            f."departureActualTime",
            f."departureDoorClosingTime",
            f."departurePassengers",
            f."departureStatus",

            -- Arrival info
            f."arrivalFlightNumber",
            f."arrivalScheduledTime",
            f."arrivalActualTime",
            f."arrivalPassengers",
            f."arrivalStatus"

        FROM "Flight" f
        INNER JOIN "Airline" a ON f."airlineId" = a.id
        WHERE f.date >= %s AND f.date <= %s
          AND (a."iataCode" IN ('W6', 'W4') OR a."icaoCode" IN ('WZZ', 'WMT'))
        ORDER BY f.date, f."departureScheduledTime", f."arrivalScheduledTime"
    """

    cursor.execute(query, (first_day, last_date))
    flights = cursor.fetchall()

    cursor.close()
    conn.close()

    return flights


def get_flight_delays(flight_id):
    """
    Povuči delay kodove za zadati let iz FlightDelay tabele

    Returns:
        List of delays: [{'phase': 'DEP', 'code': 'G8', 'minutes': 30, 'comment': '...'}, ...]
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    query = """
        SELECT
            fd.phase,
            fd.minutes,
            fd."isPrimary",
            fd.comment,
            fd."unofficialReason",
            dc.code as delay_code,
            dc.description as delay_description
        FROM "FlightDelay" fd
        INNER JOIN "DelayCode" dc ON fd."delayCodeId" = dc.id
        WHERE fd."flightId" = %s
        ORDER BY fd.phase, fd."isPrimary" DESC, fd.minutes DESC
    """

    cursor.execute(query, (flight_id,))
    delays = cursor.fetchall()

    cursor.close()
    conn.close()

    return delays


def parse_route(route_str):
    """Extract IATA code from route string"""
    if not route_str or '-' not in route_str:
        return None

    parts = route_str.strip().split('-')
    return parts[0].strip() if parts[0] else None


def generate_wizzair_performance(year: int, month: int, output_path: Path = None):
    """
    Glavni metod za generisanje Wizz Air Performance izvještaja
    """
    print(f"Generišem Wizz Air Performance izvještaj za {MONTH_NAMES[month]} {year}...")

    # 1. Povući podatke iz baze
    print("Povlačim podatke iz baze...")
    flights = get_flight_data(year, month)
    print(f"Pronađeno {len(flights)} Wizz Air letova.")

    if len(flights) == 0:
        print("UPOZORENJE: Nema Wizz Air letova za zadati period!")
        return None

    # 2. Grupiši letove po danima
    print("Grupisanje letova po danima...")
    flights_by_day = {}
    for flight in flights:
        day = flight['date'].day
        if day not in flights_by_day:
            flights_by_day[day] = []
        flights_by_day[day].append(flight)

    print(f"Letovi pronađeni za {len(flights_by_day)} dana.")

    # 3. Kreiranje Excel workbook-a
    print("Kreiram Excel workbook...")
    wb = openpyxl.Workbook()

    # Ukloni default sheet
    if 'Sheet' in wb.sheetnames:
        wb.remove(wb['Sheet'])

    # 4. Stilovi
    header_font = Font(name='Arial', size=10, bold=True)
    header_fill = PatternFill(start_color="CCCCCC", end_color="CCCCCC", fill_type="solid")
    title_font = Font(name='Arial', size=12, bold=True)
    regular_font = Font(name='Arial', size=9)
    border = Border(
        left=Side(style='thin'),
        right=Side(style='thin'),
        top=Side(style='thin'),
        bottom=Side(style='thin')
    )
    center_align = Alignment(horizontal='center', vertical='center')
    left_align = Alignment(horizontal='left', vertical='center')

    # 5. Kreiranje sheet-a za svaki dan u mjesecu
    num_days = calendar.monthrange(year, month)[1]

    for day in range(1, num_days + 1):
        # Kreiraj sheet za ovaj dan
        sheet_name = f"{day:02d}"
        ws = wb.create_sheet(title=sheet_name)

        # Header - Row 1: Title
        create_merged_cell(
            ws, 1, 'A', 'U',
            "WIZZ Air Daily Performance Table",
            font=title_font,
            alignment=center_align
        )

        # Header - Row 2: Column headers
        headers = [
            'Nr', 'Date', 'Flight Nr', 'Desk', 'A/C Reg', 'STA', 'ATA', 'STD', 'DCT', 'ATD', 'Total delay',
            # Delay 1
            'Min', 'DL code', 'Reason',
            # Delay 2
            'Min', 'DL code', 'Reason',
            # Delay 3
            'Min', 'DL code', 'Reason',
            'PAX'
        ]

        for col_idx, header_text in enumerate(headers, start=1):
            cell = ws.cell(row=2, column=col_idx)
            cell.value = header_text
            cell.font = header_font
            cell.fill = header_fill
            cell.border = border
            cell.alignment = center_align

        # Popuni podatke za ovaj dan
        day_flights = flights_by_day.get(day, [])
        row_idx = 3
        flight_nr = 1

        for flight in day_flights:
            # Parse route
            desk = parse_route(flight['route']) or ''

            # Convert times to UTC
            flight_date = flight['date']

            sta_utc = convert_to_utc(flight['arrivalScheduledTime'], flight_date) if flight.get('arrivalScheduledTime') else None
            ata_utc = convert_to_utc(flight['arrivalActualTime'], flight_date) if flight.get('arrivalActualTime') else None
            std_utc = convert_to_utc(flight['departureScheduledTime'], flight_date) if flight.get('departureScheduledTime') else None
            dct_utc = convert_to_utc(flight['departureDoorClosingTime'], flight_date) if flight.get('departureDoorClosingTime') else None
            atd_utc = convert_to_utc(flight['departureActualTime'], flight_date) if flight.get('departureActualTime') else None

            # Calculate total delay (departure delay)
            total_delay_minutes = calculate_delay_minutes(std_utc, atd_utc)

            # Get delays from database
            delays = get_flight_delays(flight['id'])

            # Filter only departure delays for this report
            dep_delays = [d for d in delays if d['phase'] == 'DEP']

            # Basic flight info
            ws.cell(row=row_idx, column=1).value = flight_nr  # Nr
            ws.cell(row=row_idx, column=2).value = flight_date.strftime('%d/%m/%Y')  # Date
            ws.cell(row=row_idx, column=3).value = flight.get('departureFlightNumber') or flight.get('arrivalFlightNumber') or ''  # Flight Nr
            ws.cell(row=row_idx, column=4).value = desk  # Desk
            ws.cell(row=row_idx, column=5).value = flight['registration']  # A/C Reg
            ws.cell(row=row_idx, column=6).value = format_time_utc(sta_utc)  # STA
            ws.cell(row=row_idx, column=7).value = format_time_utc(ata_utc)  # ATA
            ws.cell(row=row_idx, column=8).value = format_time_utc(std_utc)  # STD
            ws.cell(row=row_idx, column=9).value = format_time_utc(dct_utc)  # DCT
            ws.cell(row=row_idx, column=10).value = format_time_utc(atd_utc)  # ATD

            # Total delay
            if total_delay_minutes and total_delay_minutes > 0:
                # Format as H:MM
                hours = total_delay_minutes // 60
                mins = total_delay_minutes % 60
                ws.cell(row=row_idx, column=11).value = f"{hours}:{mins:02d}"
            else:
                ws.cell(row=row_idx, column=11).value = "No Delay"

            # Delay codes (up to 3)
            for i, delay in enumerate(dep_delays[:3]):
                base_col = 12 + (i * 3)  # Delay 1 starts at col 12, Delay 2 at 15, Delay 3 at 18
                ws.cell(row=row_idx, column=base_col).value = delay['minutes']  # Min
                ws.cell(row=row_idx, column=base_col + 1).value = delay['delay_code']  # DL code
                ws.cell(row=row_idx, column=base_col + 2).value = delay.get('comment') or delay.get('delay_description') or ''  # Reason

            # PAX
            pax = flight.get('departurePassengers') or flight.get('arrivalPassengers') or ''
            ws.cell(row=row_idx, column=21).value = pax  # PAX

            # Apply styles
            for col in range(1, 22):
                cell = ws.cell(row=row_idx, column=col)
                cell.font = regular_font
                cell.border = border
                if col in [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 13, 15, 16, 18, 19, 21]:
                    cell.alignment = center_align
                else:
                    cell.alignment = left_align

            row_idx += 1
            flight_nr += 1

        # Column widths
        ws.column_dimensions['A'].width = 5   # Nr
        ws.column_dimensions['B'].width = 12  # Date
        ws.column_dimensions['C'].width = 10  # Flight Nr
        ws.column_dimensions['D'].width = 8   # Desk
        ws.column_dimensions['E'].width = 10  # A/C Reg
        ws.column_dimensions['F'].width = 8   # STA
        ws.column_dimensions['G'].width = 8   # ATA
        ws.column_dimensions['H'].width = 8   # STD
        ws.column_dimensions['I'].width = 8   # DCT
        ws.column_dimensions['J'].width = 8   # ATD
        ws.column_dimensions['K'].width = 12  # Total delay
        ws.column_dimensions['L'].width = 6   # Min
        ws.column_dimensions['M'].width = 8   # DL code
        ws.column_dimensions['N'].width = 30  # Reason
        ws.column_dimensions['O'].width = 6   # Min
        ws.column_dimensions['P'].width = 8   # DL code
        ws.column_dimensions['Q'].width = 30  # Reason
        ws.column_dimensions['R'].width = 6   # Min
        ws.column_dimensions['S'].width = 8   # DL code
        ws.column_dimensions['T'].width = 30  # Reason
        ws.column_dimensions['U'].width = 8   # PAX

    # 6. Sačuvaj fajl
    if output_path is None:
        OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
        output_path = OUTPUT_DIR / f"Wizz_Air_Performance_{MONTH_NAMES[month]}_{year}.xlsx"

    print(f"Čuvam izvještaj u: {output_path}")
    wb.save(output_path)
    print(f"✅ Wizz Air Performance izvještaj uspješno generisan!")

    return str(output_path)


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python generate_wizzair_performance.py <year> <month>")
        print("Example: python generate_wizzair_performance.py 2025 10")
        sys.exit(1)

    year = int(sys.argv[1])
    month = int(sys.argv[2])

    if month < 1 or month > 12:
        print("Mjesec mora biti između 1 i 12")
        sys.exit(1)

    try:
        output_file = generate_wizzair_performance(year, month)
        print(f"\nIzvještaj sačuvan: {output_file}")
    except Exception as e:
        print(f"GREŠKA: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
