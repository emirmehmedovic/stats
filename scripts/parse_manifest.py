#!/usr/bin/env python3
"""
Manifest Parser for STW Predboarding System

Parses passenger manifest .txt files from airlines (Wizz Air format)
Extracts passenger list with boarding information
Returns JSON for API consumption
"""

import sys
import json
import re
from pathlib import Path


def parse_manifest(file_path):
    """
    Parse manifest file and extract passenger data

    Returns:
    {
      "success": true,
      "data": {
        "flightInfo": { ... },
        "passengers": [ ... ],
        "summary": { ... }
      }
    }
    """
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()

        # Extract flight info
        flight_info = extract_flight_info(content)

        # Extract passenger list
        passengers = extract_passengers(content)

        # Extract summary
        summary = extract_summary(content)

        return {
            "success": True,
            "data": {
                "flightInfo": flight_info,
                "passengers": passengers,
                "summary": summary
            }
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


def extract_flight_info(content):
    """Extract flight information from header"""
    flight_info = {}

    # Extract flight date
    # Format: | Flight Date:  15Nov25
    date_match = re.search(r'Flight Date:\s+(\d{2}\w{3}\d{2})', content)
    if date_match:
        flight_info['date'] = date_match.group(1)

    # Extract flight number and route
    # Format: | Flight Info:  W6  4298    Open     DTM         TZL  |
    flight_match = re.search(r'Flight Info:\s+(\w+)\s+(\d+)\s+\w+\s+(\w+)\s+(\w+)', content)
    if flight_match:
        airline_code = flight_match.group(1)
        flight_num = flight_match.group(2)
        from_airport = flight_match.group(3)
        to_airport = flight_match.group(4)

        flight_info['airline'] = airline_code
        flight_info['flightNumber'] = f"{airline_code} {flight_num}"
        flight_info['from'] = from_airport
        flight_info['to'] = to_airport
        flight_info['route'] = f"{from_airport}-{to_airport}"

    # Extract departure and arrival times
    # Format: Dep. 10:25  Arv. 12:25
    times_match = re.search(r'Dep\.\s+(\d{2}:\d{2})\s+Arv\.\s+(\d{2}:\d{2})', content)
    if times_match:
        flight_info['departureTime'] = times_match.group(1)
        flight_info['arrivalTime'] = times_match.group(2)

    return flight_info


def extract_passengers(content):
    """
    Extract passenger list from manifest

    Format example:
      Abazaj,Damir             MR     13Nov25  KREG      TT8U3B01             1C
      Cerni,Kristina        i  MS     07Aug25  BOREG     AKSG8G01            30D
       Cerni,Dino              MR                        AKSG8G02            34F
    """
    passengers = []

    # Find the passenger list section
    lines = content.split('\n')

    in_passenger_section = False
    current_main_passenger = None

    for line in lines:
        # Start of passenger section
        if 'Listed Confirmed Passengers:' in line:
            in_passenger_section = True
            continue

        # End of passenger section (only on "Total Confirm" or final separator)
        if in_passenger_section:
            # End when we hit the summary line
            if 'Total Confirm Manifested:' in line:
                break
            # Or end on a very long separator line AFTER we've started collecting passengers
            if line.strip().startswith('---') and len(line.strip()) > 70 and len(passengers) > 0:
                break

        if not in_passenger_section:
            continue

        # Skip header lines and initial separator
        if 'Passenger' in line or 'Name (i= INF)' in line:
            continue

        # Skip separator lines at the start of passenger section (before any passengers)
        if line.strip().startswith('---'):
            continue

        # Skip SSR lines and route lines
        if 'SSR(s):' in line or re.match(r'^\s+(DTM|TZL|[A-Z]{3})[A-Z]{3}\s+\d{2}\w{3}\d{2}', line):
            continue

        # Empty line
        if not line.strip():
            continue

        # Check if this is a passenger line (main or companion)
        # Main passengers start with exactly 2 spaces
        if line.startswith('  ') and not line.startswith('   ') and ',' in line[:35]:
            # This is a main passenger
            # Format: "  Name (may have spaces)    Title  Date     FareClass PassID   [F]  Seat"
            # Example: "  Abazaj,Damir             MR     13Nov25  KREG      TT8U3B01             1C"
            # Example: "  Abdelwahed,Shehab Moh    MR     12Oct25  KLREG     OHVWSV02   F         9A"

            # Use regex with flexible spacing
            passenger_match = re.match(
                r'^\s{2}([A-Za-z\-\s]+,[A-Za-z\-\s]+?)\s+(i\s+)?([A-Z]{2,5})\s+(\d{2}\w{3}\d{2})?\s+(\w+)?\s+(\w+)?\s+(F)?\s+(\d{1,2}[A-F])?\s*',
                line
            )

            if passenger_match:
                name = passenger_match.group(1).strip()
                is_infant = passenger_match.group(2) is not None
                title = passenger_match.group(3)
                date_confirm = passenger_match.group(4)
                fare_class = passenger_match.group(5)
                passenger_id = passenger_match.group(6)
                flight_status = passenger_match.group(7)
                seat = passenger_match.group(8)

                passenger = {
                    'passengerName': name,
                    'title': title,
                    'isInfant': is_infant,
                    'confirmationDate': date_confirm,
                    'fareClass': fare_class,
                    'passengerId': passenger_id,
                    'seatNumber': seat,
                    'flightStatus': flight_status
                }
                passengers.append(passenger)
                current_main_passenger = passenger

        elif line.startswith('   ') and not line.startswith('     ') and ',' in line and current_main_passenger:
            # This is a companion passenger (starts with 3+ spaces)
            # Format: "   Name              Title              PassID      [F]  Seat"
            companion_match = re.match(
                r'^\s{3,}([A-Za-z\-\s]+,[A-Za-z\-\s]+?)\s+(i\s+)?([A-Z]{2,5})?\s+(\w+)?\s+(F)?\s+(\d{1,2}[A-F])?\s*',
                line
            )

            if companion_match:
                name = companion_match.group(1).strip()
                is_infant = companion_match.group(2) is not None
                title_match = companion_match.group(3)

                # Title might be missing for companions
                if title_match and title_match in ['MR', 'MS', 'MRS', 'CHD', 'MSTR', 'MISS']:
                    title = title_match
                    passenger_id = companion_match.group(4)
                    flight_status = companion_match.group(5)
                    seat = companion_match.group(6)
                else:
                    # No title, so what we thought was title is actually passenger ID
                    title = 'CHD'  # Default for companions without title
                    passenger_id = title_match
                    flight_status = companion_match.group(4)
                    seat = companion_match.group(5)

                companion = {
                    'passengerName': name,
                    'title': title,
                    'isInfant': is_infant,
                    'confirmationDate': None,
                    'fareClass': None,
                    'passengerId': passenger_id,
                    'seatNumber': seat,
                    'flightStatus': flight_status
                }
                passengers.append(companion)

    return passengers


def extract_summary(content):
    """Extract summary statistics from manifest"""
    summary = {}

    # Total passengers
    # Format: Total Confirm Manifested:  241  Male: 147  Female:  80  Child:   6  Infant:   8
    total_match = re.search(r'Total Confirm Manifested:\s+(\d+)\s+Male:\s+(\d+)\s+Female:\s+(\d+)\s+Child:\s+(\d+)\s+Infant:\s+(\d+)', content)
    if total_match:
        summary['totalPax'] = int(total_match.group(1))
        summary['male'] = int(total_match.group(2))
        summary['female'] = int(total_match.group(3))
        summary['children'] = int(total_match.group(4))
        summary['infants'] = int(total_match.group(5))

    return summary


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(json.dumps({
            "success": False,
            "error": "File path is required as argument"
        }))
        sys.exit(1)

    file_path = sys.argv[1]

    if not Path(file_path).exists():
        print(json.dumps({
            "success": False,
            "error": f"File not found: {file_path}"
        }))
        sys.exit(1)

    result = parse_manifest(file_path)
    print(json.dumps(result, ensure_ascii=False, indent=2))
