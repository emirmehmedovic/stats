#!/usr/bin/env python3
"""
Manifest Parser for STW Predboarding System

Parses passenger manifest files from airlines.
Supports legacy text manifests and OXPS/XPS table exports.
Returns JSON for API consumption.
"""

import json
import re
import sys
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

VENDOR_DIR = Path(__file__).resolve().parents[1] / ".vendor"
if VENDOR_DIR.exists():
    sys.path.insert(0, str(VENDOR_DIR))

from pypdf import PdfReader


XPS_NS = {"xps": "http://schemas.openxps.org/oxps/v1.0"}
TABLE_ROW_RE = re.compile(
    r"^\|\s*(\d+)\|([A-Z0-9]{6,8})\s*\|([^|]+?)\|([^|]*)\|([^|]*)\|([^|]*)\|([^|]*)\|([^|]*)\|([^|]*)\|([^|]*)\|([^|]+)\|?$"
)
DATE_VALUE_RE = re.compile(r"^\d{2}[A-Z]{3}\d{2}$")
PEGASUS_HEADER_RE = re.compile(
    r"Number\s+PNR\s+Surname\s*/\s*Name\s+Gender\s+PNR Status\s+PNR Owner\s+Ticket No\s+Leg Status\s+Cabin Class\s+C STATUS",
    re.IGNORECASE,
)
ALL_RESERVATION_HEADER_RE = re.compile(
    r"No\s+Surname\s+Name\s+G\s+GC\s+PNR\s+PNR Status\s+PNR Owner",
    re.IGNORECASE,
)


def parse_manifest(file_path):
    """
    Parse manifest file and extract passenger data.

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
        path = Path(file_path)
        content = read_manifest_content(path)

        if path.suffix.lower() in {".oxps", ".xps"}:
            flight_info = extract_flight_info_from_xps(content)
            passengers = extract_passengers_from_xps(content)
            summary = extract_summary_from_xps(content, passengers)
        elif is_pegasus_manifest(content):
            flight_info = extract_flight_info_from_pegasus(content)
            passengers = extract_passengers_from_pegasus(content)
            summary = extract_summary_from_pegasus(passengers)
        elif is_all_reservation_list(content):
            flight_info = extract_flight_info_from_all_reservation(content)
            passengers = extract_passengers_from_all_reservation(content)
            summary = extract_summary_from_all_reservation(passengers)
        else:
            flight_info = extract_flight_info_from_text(content)
            passengers = extract_passengers_from_text(content)
            summary = extract_summary_from_text(content)

        return {
            "success": True,
            "data": {
                "flightInfo": flight_info,
                "passengers": passengers,
                "summary": summary,
            },
        }
    except Exception as exc:
        return {"success": False, "error": str(exc)}


def read_manifest_content(path):
    suffix = path.suffix.lower()
    if suffix in {".oxps", ".xps"}:
        return extract_xps_lines(path)
    if suffix == ".pdf":
        return extract_pdf_text(path)

    with open(path, "r", encoding="utf-8", errors="ignore") as file:
        return file.read()


def extract_xps_lines(path):
    lines = []

    with zipfile.ZipFile(path) as archive:
        page_names = sorted(
            name for name in archive.namelist() if name.lower().endswith(".fpage")
        )

        for page_name in page_names:
            root = ET.fromstring(archive.read(page_name))
            for glyph in root.findall(".//xps:Glyphs", XPS_NS):
                unicode_string = glyph.attrib.get("UnicodeString")
                if unicode_string:
                    lines.append(unicode_string)

    return "\n".join(lines)


def extract_pdf_text(path):
    text_chunks = []
    reader = PdfReader(str(path))

    for page in reader.pages:
        text = page.extract_text() or ""
        if text:
            text_chunks.append(text)

    content = "\n".join(text_chunks)
    if not content.strip():
        raise ValueError("PDF ne sadrži čitljiv tekst za parsiranje")

    return content


def extract_flight_info_from_text(content):
    """Extract flight information from legacy text header."""
    flight_info = {}

    date_match = re.search(r"Flight Date:\s+(\d{2}\w{3}\d{2})", content)
    if date_match:
        flight_info["date"] = date_match.group(1)

    flight_match = re.search(
        r"Flight Info:\s+(\w+)\s+(\d+)\s+\w+\s+(\w+)\s+(\w+)", content
    )
    if flight_match:
        airline_code = flight_match.group(1)
        flight_num = flight_match.group(2)
        from_airport = flight_match.group(3)
        to_airport = flight_match.group(4)

        flight_info["airline"] = airline_code
        flight_info["flightNumber"] = f"{airline_code} {flight_num}"
        flight_info["from"] = from_airport
        flight_info["to"] = to_airport
        flight_info["route"] = f"{from_airport}-{to_airport}"

    times_match = re.search(r"Dep\.\s+(\d{2}:\d{2})\s+Arv\.\s+(\d{2}:\d{2})", content)
    if times_match:
        flight_info["departureTime"] = times_match.group(1)
        flight_info["arrivalTime"] = times_match.group(2)

    return flight_info


def is_pegasus_manifest(content):
    return PEGASUS_HEADER_RE.search(content) is not None


def is_all_reservation_list(content):
    """Detektuje ALL Reservation List format."""
    return ALL_RESERVATION_HEADER_RE.search(content) is not None


def extract_flight_info_from_pegasus(content):
    flight_info = {}

    first_line = next((line.strip() for line in content.splitlines() if line.strip()), "")
    match = re.match(
        r"(\d{2}/[A-Za-z]{3}/\d{4})\s+([A-Z]{2}\d+)\s+([A-Z]{3})\s*-\s*([A-Z]{3})",
        first_line,
    )
    if not match:
        return flight_info

    date_value, flight_number, from_airport, to_airport = match.groups()
    airline_match = re.match(r"([A-Z]{2})(\d+)", flight_number)

    flight_info["date"] = date_value
    flight_info["flightNumber"] = flight_number
    flight_info["from"] = from_airport
    flight_info["to"] = to_airport
    flight_info["route"] = f"{from_airport}-{to_airport}"

    if airline_match:
        flight_info["airline"] = airline_match.group(1)

    return flight_info


def extract_flight_info_from_xps(content):
    """Extract flight information from table-style XPS/OXPS header."""
    flight_info = {}

    match = re.search(
        r"Flight No:\s*(\d+)\s+Date:\s*(\d{2}[A-Z]{3}\d{2})\s+Route:\s*([A-Z]{6})\s+Equip:\s*([A-Z0-9]+)\s+Seats:\s*(\d+)",
        content,
    )
    if not match:
        return flight_info

    flight_number, date_value, route, equipment, seats = match.groups()
    from_airport = route[:3]
    to_airport = route[3:6]

    flight_info["flightNumber"] = flight_number
    flight_info["date"] = date_value
    flight_info["from"] = from_airport
    flight_info["to"] = to_airport
    flight_info["route"] = f"{from_airport}-{to_airport}"
    flight_info["equipment"] = equipment
    flight_info["seats"] = int(seats)

    return flight_info


def extract_passengers_from_text(content):
    """
    Extract passenger list from legacy text manifest.
    """
    passengers = []
    lines = content.split("\n")
    in_passenger_section = False
    current_main_passenger = None

    for line in lines:
        if "Listed Confirmed Passengers:" in line:
            in_passenger_section = True
            continue

        if in_passenger_section:
            if "Total Confirm Manifested:" in line:
                break
            if line.strip().startswith("---") and len(line.strip()) > 70 and len(passengers) > 0:
                break

        if not in_passenger_section:
            continue

        if "Passenger" in line or "Name (i= INF)" in line:
            continue

        if line.strip().startswith("---"):
            continue

        if "SSR(s):" in line or re.match(r"^\s+(DTM|TZL|[A-Z]{3})[A-Z]{3}\s+\d{2}\w{3}\d{2}", line):
            continue

        if not line.strip():
            continue

        if line.startswith("  ") and not line.startswith("   ") and "," in line[:35]:
            passenger_match = re.match(
                r"^\s{2}([A-Za-z\-\s]+,[A-Za-z\-\s]+?)\s+(i\s+)?([A-Z]{2,5})\s+(\d{2}\w{3}\d{2})?\s+(\w+)?\s+(\w+)?\s+(F)?\s+(\d{1,2}[A-F])?\s*",
                line,
            )

            if passenger_match:
                passenger = {
                    "passengerName": passenger_match.group(1).strip(),
                    "rawPassengerName": passenger_match.group(1).strip(),
                    "title": passenger_match.group(3),
                    "isInfant": passenger_match.group(2) is not None,
                    "confirmationDate": passenger_match.group(4),
                    "fareClass": passenger_match.group(5),
                    "passengerId": passenger_match.group(6),
                    "seatNumber": passenger_match.group(8),
                    "sequenceNumber": None,
                    "flightStatus": passenger_match.group(7),
                }
                passengers.append(passenger)
                current_main_passenger = passenger

        elif line.startswith("   ") and not line.startswith("     ") and "," in line and current_main_passenger:
            companion_match = re.match(
                r"^\s{3,}([A-Za-z\-\s]+,[A-Za-z\-\s]+?)\s+(i\s+)?([A-Z]{2,5})?\s+(\w+)?\s+(F)?\s+(\d{1,2}[A-F])?\s*",
                line,
            )

            if companion_match:
                title_match = companion_match.group(3)
                if title_match and title_match in ["MR", "MS", "MRS", "CHD", "MSTR", "MISS"]:
                    title = title_match
                    passenger_id = companion_match.group(4)
                    flight_status = companion_match.group(5)
                    seat = companion_match.group(6)
                else:
                    title = "CHD"
                    passenger_id = title_match
                    flight_status = companion_match.group(4)
                    seat = companion_match.group(5)

                passengers.append(
                    {
                        "passengerName": companion_match.group(1).strip(),
                        "rawPassengerName": companion_match.group(1).strip(),
                        "title": title,
                        "isInfant": companion_match.group(2) is not None,
                        "confirmationDate": None,
                        "fareClass": None,
                        "passengerId": passenger_id,
                        "seatNumber": seat,
                        "sequenceNumber": None,
                        "flightStatus": flight_status,
                    }
                )

    return passengers


def extract_passengers_from_xps(content):
    """
    Extract passenger list from Wizz Air XPS/OXPS table exports.
    """
    passengers = []
    detail_rows = extract_xps_detail_rows(content)

    for raw_line in content.splitlines():
        if "Passenger Name" in raw_line or "Record" in raw_line or "Flight No:" in raw_line:
            continue
        if "Page Total:" in raw_line or "Grand Total:" in raw_line or "End of report" in raw_line:
            continue

        match = TABLE_ROW_RE.match(raw_line)
        if not match:
            continue

        (
            line_no,
            locator,
            raw_name,
            sequence_no,
            seat_no,
            _bags,
            _male,
            _female,
            _child,
            _infant,
            special_info,
        ) = [value.strip() for value in match.groups()]

        detail_key = build_xps_detail_key(locator, sequence_no)
        detail_name = detail_rows.get(detail_key)

        passenger_name, title, is_infant = normalize_xps_name(raw_name)
        raw_passenger_name = raw_name.strip()
        if detail_name:
            detail_passenger_name, detail_title, detail_is_infant = normalize_xps_name(detail_name)
            if should_prefer_detail_name(passenger_name, detail_passenger_name):
                passenger_name = detail_passenger_name
                raw_passenger_name = detail_name.strip()
            if title == "MR" and detail_title != "MR":
                title = detail_title
            is_infant = is_infant or detail_is_infant

        passengers.append(
            {
                "lineNumber": int(line_no),
                "passengerName": passenger_name,
                "rawPassengerName": raw_passenger_name,
                "title": title,
                "isInfant": is_infant,
                "confirmationDate": None,
                "fareClass": None,
                "passengerId": locator,
                "seatNumber": normalize_blank(seat_no),
                "sequenceNumber": normalize_blank(sequence_no),
                "flightStatus": normalize_blank(special_info),
            }
        )

    return passengers


def extract_passengers_from_pegasus(content):
    passengers = []
    in_passenger_section = False

    for raw_line in content.splitlines():
        line = raw_line.rstrip()
        if not line.strip():
            continue

        if PEGASUS_HEADER_RE.search(line):
            in_passenger_section = True
            continue

        if not in_passenger_section:
            continue

        parsed = parse_pegasus_passenger_line(line)
        if not parsed:
            continue

        passengers.append(parsed)

    return passengers


def parse_pegasus_passenger_line(line):
    parts = re.split(r"\s{2,}", line.strip())
    if len(parts) < 8:
        return None

    line_number = parts[0]
    locator = parts[1]
    if not line_number.isdigit() or not re.fullmatch(r"[A-Z0-9]{6}", locator):
        return None

    remaining = parts[2:]
    if len(remaining) < 6:
        return None

    name_field = remaining[0].strip()
    gender_value = None

    next_value = remaining[1].strip() if len(remaining) > 1 else ""
    if next_value in {"M", "F", "C"}:
        gender_value = next_value
        remaining = remaining[2:]
    else:
        extracted_name, extracted_gender = split_pegasus_name_and_gender(name_field)
        name_field = extracted_name
        gender_value = extracted_gender
        remaining = remaining[1:]

    if gender_value is None or len(remaining) < 5:
        return None

    status_owner = remaining[0].strip()
    status_owner_match = re.match(r"(\*\*[A-Z]{2})\s+(.+)", status_owner)
    if status_owner_match:
        pnr_status = status_owner_match.group(1)
        pnr_owner = status_owner_match.group(2)
    else:
        pnr_status = status_owner
        pnr_owner = None

    ticket_no = remaining[1] if len(remaining) > 1 else None
    leg_status = remaining[2] if len(remaining) > 2 else None
    cabin_class = remaining[3] if len(remaining) > 3 else None
    c_status = remaining[4] if len(remaining) > 4 else None

    passenger_name = normalize_pegasus_name(name_field)

    return {
        "lineNumber": int(line_number),
        "passengerName": passenger_name,
        "rawPassengerName": name_field,
        "title": map_pegasus_gender_to_title(gender_value),
        "isInfant": False,
        "confirmationDate": None,
        "fareClass": normalize_blank(cabin_class),
        "passengerId": locator,
        "seatNumber": None,
        "sequenceNumber": None,
        "flightStatus": normalize_blank(leg_status) or normalize_blank(pnr_status),
        "ticketNumber": normalize_blank(ticket_no),
        "pnrStatus": normalize_blank(pnr_status),
        "pnrOwner": normalize_blank(pnr_owner),
        "cStatus": normalize_blank(c_status),
    }


def split_pegasus_name_and_gender(name_field):
    compact_name = name_field.strip()
    if not compact_name:
        return compact_name, None

    if compact_name.endswith((" M", " F", " C")):
        return compact_name[:-2].strip(), compact_name[-1]

    if compact_name[-1] in {"M", "F", "C"}:
        return compact_name[:-1].rstrip(), compact_name[-1]

    return compact_name, None


def normalize_pegasus_name(name_field):
    normalized = re.sub(r"\s+", " ", name_field.strip().upper())
    parts = normalized.split(" ", 1)
    if len(parts) == 2:
        surname, given_names = parts
        return f"{surname}/{given_names.replace(' ', ' ').strip()}"
    return normalized.replace(" ", "/")


def map_pegasus_gender_to_title(gender_value):
    return {
        "M": "MR",
        "F": "MS",
        "C": "CHD",
    }.get(gender_value, "MR")


def normalize_xps_name(raw_name):
    compact = re.sub(r"\s+", "", raw_name.upper())
    compact = compact.replace(" ", "")

    is_infant = compact.endswith("+I")
    if is_infant:
        compact = compact[:-2]

    title = "MR"
    title_patterns = [
        (r"(CHD(?:\*C)?)$", "CHD"),
        (r"(INF(?:\*C)?)$", "INF"),
        (r"(MSTR(?:\*C)?)$", "MSTR"),
        (r"(MISS(?:\*C)?)$", "MISS"),
        (r"(MRS(?:\*C)?)$", "MRS"),
        (r"(MS(?:\*C)?)$", "MS"),
        (r"(MR(?:\*C)?)$", "MR"),
    ]

    for pattern, mapped_title in title_patterns:
        match = re.search(pattern, compact)
        if match:
            compact = compact[: match.start()]
            title = mapped_title
            break

    return compact, title, is_infant


def extract_xps_detail_rows(content):
    detail_rows = {}

    for raw_line in content.splitlines():
        if "Passenger Name" in raw_line or "Flight No:" in raw_line:
            continue
        if not raw_line.strip().startswith("|"):
            continue

        columns = [part.strip() for part in raw_line.strip().strip("|").split("|")]
        if len(columns) < 5:
            continue

        line_no, locator, raw_name, sequence_no = columns[:4]
        date_or_seat = columns[4]

        if not line_no.isdigit():
            continue
        if not re.fullmatch(r"[A-Z0-9]{6,8}", locator):
            continue
        if not DATE_VALUE_RE.fullmatch(date_or_seat):
            continue
        if not raw_name:
            continue

        detail_rows[build_xps_detail_key(locator, sequence_no)] = raw_name

    return detail_rows


def build_xps_detail_key(locator, sequence_no):
    return f"{locator.strip()}::{normalize_blank(sequence_no) or ''}"


def should_prefer_detail_name(base_name, detail_name):
    if not detail_name:
        return False
    if not base_name:
        return True

    base_segments = split_name_segments(base_name)
    detail_segments = split_name_segments(detail_name)

    if len(base_segments) < 2 or len(detail_segments) < 2:
        return False

    if not segments_are_similar(base_segments[0], detail_segments[0]):
        return False

    if not segments_are_similar(base_segments[1], detail_segments[1]):
        return False

    if len(detail_segments[1]) > len(base_segments[1]):
        return True

    if "*" in base_name and "*" not in detail_name:
        return True

    return False


def split_name_segments(name):
    normalized = re.sub(r"[^A-Z0-9/]+", " ", name.upper()).strip()
    if "/" in normalized:
        return [segment.strip() for segment in normalized.split("/") if segment.strip()]
    return [segment.strip() for segment in normalized.split() if segment.strip()]


def segments_are_similar(left, right):
    if left == right:
        return True
    if left.startswith(right) or right.startswith(left):
        return True

    min_length = min(len(left), len(right))
    if min_length < 4:
        return False

    return left[:min_length] == right[:min_length]


def normalize_blank(value):
    if value is None:
        return None
    cleaned = value.strip()
    if cleaned == "" or set(cleaned) == {"_"}:
        return None
    return cleaned


def extract_summary_from_text(content):
    """Extract summary statistics from legacy text manifest."""
    summary = {}

    total_match = re.search(
        r"Total Confirm Manifested:\s+(\d+)\s+Male:\s+(\d+)\s+Female:\s+(\d+)\s+Child:\s+(\d+)\s+Infant:\s+(\d+)",
        content,
    )
    if total_match:
        summary["totalPax"] = int(total_match.group(1))
        summary["male"] = int(total_match.group(2))
        summary["female"] = int(total_match.group(3))
        summary["children"] = int(total_match.group(4))
        summary["infants"] = int(total_match.group(5))

    return summary


def extract_summary_from_xps(content, passengers):
    """Build summary from parsed XPS passengers."""
    children = sum(1 for passenger in passengers if passenger["title"] == "CHD")
    infants = sum(1 for passenger in passengers if passenger["isInfant"] or passenger["title"] == "INF")
    females = sum(1 for passenger in passengers if passenger["title"] in {"MS", "MRS", "MISS"})
    males = max(len(passengers) - children - infants - females, 0)

    summary = {
        "totalPax": len(passengers),
        "male": males,
        "female": females,
        "children": children,
        "infants": infants,
    }

    seats_match = re.search(r"Seats:\s*(\d+)", content)
    if seats_match:
        summary["seats"] = int(seats_match.group(1))

    return summary


def extract_summary_from_pegasus(passengers):
    children = sum(1 for passenger in passengers if passenger["title"] == "CHD")
    infants = sum(1 for passenger in passengers if passenger["isInfant"] or passenger["title"] == "INF")
    females = sum(1 for passenger in passengers if passenger["title"] in {"MS", "MRS", "MISS"})
    males = max(len(passengers) - children - infants - females, 0)

    return {
        "totalPax": len(passengers),
        "male": males,
        "female": females,
        "children": children,
        "infants": infants,
    }


def extract_flight_info_from_all_reservation(content):
    """Extract flight information from ALL Reservation List format."""
    flight_info = {}

    # Format: 27/Apr/2026 VF272 TZL - SAW
    for line in content.splitlines():
        line = line.strip()
        if not line or line.startswith("ALL Reserv") or line.startswith("No "):
            continue

        match = re.match(
            r"(\d{2}/[A-Za-z]{3}/\d{4})\s+([A-Z]{2}\d+)\s+([A-Z]{3})\s*-\s*([A-Z]{3})",
            line,
        )
        if match:
            date_value, flight_number, from_airport, to_airport = match.groups()
            airline_match = re.match(r"([A-Z]{2})(\d+)", flight_number)

            flight_info["date"] = date_value
            flight_info["flightNumber"] = flight_number
            flight_info["from"] = from_airport
            flight_info["to"] = to_airport
            flight_info["route"] = f"{from_airport}-{to_airport}"

            if airline_match:
                flight_info["airline"] = airline_match.group(1)

            break

    return flight_info


def extract_passengers_from_all_reservation(content):
    """Extract passenger list from ALL Reservation List format."""
    passengers = []
    in_passenger_section = False
    column_positions = None

    for raw_line in content.splitlines():
        line = raw_line.rstrip()
        if not line.strip():
            continue

        # Detektuj header i ekstrahuj pozicije kolona
        if ALL_RESERVATION_HEADER_RE.search(line):
            in_passenger_section = True
            column_positions = extract_all_reservation_column_positions(line)
            continue

        if not in_passenger_section:
            continue

        # Detektuj kraj liste
        if line.strip().startswith("END LIST") or line.strip().startswith("Total Pax"):
            break

        # Parsiraj liniju putnika koristeći pozicije kolona
        parsed = parse_all_reservation_passenger_line(line, column_positions)
        if not parsed:
            continue

        passengers.append(parsed)

    return passengers


def extract_all_reservation_column_positions(header_line):
    """Extract column positions from header line for fixed-width parsing."""
    positions = {}

    # Pronađi pozicije glavnih kolona
    positions["No"] = header_line.find("No")
    positions["Surname"] = header_line.find("Surname")
    positions["Name"] = header_line.find("Name")
    positions["G"] = header_line.find("G    GC")  # G kolona
    positions["GC"] = header_line.find("GC    PNR")  # GC kolona
    positions["PNR"] = header_line.find("PNR       PNR Status")  # PNR kolona
    positions["PNR Status"] = header_line.find("PNR Status   PNR Owner")
    positions["PNR Owner"] = header_line.find("PNR Owner Ticket")
    positions["Ticket No"] = header_line.find("Ticket No")
    positions["FROM"] = header_line.find("FROM")
    positions["TO"] = header_line.find("TO     Flight")
    positions["Flight Status"] = header_line.find("Flight Status")
    positions["DOS"] = header_line.find("DOS")
    positions["CC"] = header_line.find("CC    C.S")
    positions["C.S"] = header_line.find("C.S")

    return positions


def parse_all_reservation_passenger_line(line, column_positions):
    """Parse single passenger line using fixed-width column positions."""
    if not column_positions:
        return None

    # Prvo provjeri da li je ovo validna linija putnika
    line_number_str = line[: column_positions.get("Surname", 5)].strip()
    if not line_number_str or not line_number_str.isdigit():
        return None

    line_number = int(line_number_str)

    # Ekstrahuj polja prema pozicijama
    def extract_field(start_key, end_key=None):
        start_pos = column_positions.get(start_key)
        if start_pos is None or start_pos < 0:
            return None

        if end_key:
            end_pos = column_positions.get(end_key)
            if end_pos is None or end_pos < 0:
                return line[start_pos:].strip()
            return line[start_pos:end_pos].strip()
        return line[start_pos:].strip()

    surname = extract_field("Surname", "Name")
    given_name = extract_field("Name", "G")
    gender = extract_field("G", "GC")
    group_code = extract_field("GC", "PNR")
    pnr = extract_field("PNR", "PNR Status")
    pnr_status = extract_field("PNR Status", "PNR Owner")
    pnr_owner = extract_field("PNR Owner", "Ticket No")
    ticket_no = extract_field("Ticket No", "FROM")
    from_airport = extract_field("FROM", "TO")
    to_airport = extract_field("TO", "Flight Status")
    flight_status = extract_field("Flight Status", "DOS")
    dos = extract_field("DOS", "CC")
    cabin_class = extract_field("CC", "C.S")
    c_status = extract_field("C.S")

    # Normalizuj ime putnika
    surname = surname.strip() if surname else ""
    given_name = given_name.strip() if given_name else ""
    passenger_name = f"{surname}/{given_name}" if surname and given_name else surname or given_name

    # Mapiranje pola na titulu
    title = map_gender_to_title(gender)

    # Detektuj da li je infant
    is_infant = False
    if gender and gender.strip().upper() == "C":
        if given_name and ("INF" in given_name.upper() or "INFANT" in given_name.upper()):
            is_infant = True

    return {
        "lineNumber": line_number,
        "passengerName": passenger_name,
        "rawPassengerName": f"{surname} {given_name}".strip(),
        "title": title,
        "isInfant": is_infant,
        "confirmationDate": normalize_blank(dos),
        "fareClass": normalize_blank(cabin_class),
        "passengerId": normalize_blank(pnr),
        "seatNumber": None,
        "sequenceNumber": None,
        "flightStatus": normalize_blank(flight_status),
        "ticketNumber": normalize_blank(ticket_no),
        "pnrStatus": normalize_blank(pnr_status),
        "pnrOwner": normalize_blank(pnr_owner),
        "groupCode": normalize_blank(group_code),
        "cStatus": normalize_blank(c_status),
    }


def map_gender_to_title(gender):
    """Map gender code to passenger title."""
    if not gender:
        return "MR"

    gender = gender.strip().upper()
    return {
        "M": "MR",
        "F": "MS",
        "C": "CHD",
    }.get(gender, "MR")


def extract_summary_from_all_reservation(passengers):
    """Build summary statistics from ALL Reservation List passengers."""
    children = sum(1 for passenger in passengers if passenger["title"] == "CHD")
    infants = sum(1 for passenger in passengers if passenger["isInfant"] or passenger["title"] == "INF")
    females = sum(1 for passenger in passengers if passenger["title"] in {"MS", "MRS", "MISS"})
    males = max(len(passengers) - children - infants - females, 0)

    return {
        "totalPax": len(passengers),
        "male": males,
        "female": females,
        "children": children,
        "infants": infants,
    }


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "File path is required as argument"}))
        sys.exit(1)

    file_path = sys.argv[1]
    path = Path(file_path)

    if not path.exists():
        print(json.dumps({"success": False, "error": f"File not found: {file_path}"}))
        sys.exit(1)

    result = parse_manifest(file_path)
    print(json.dumps(result, ensure_ascii=False, indent=2))
