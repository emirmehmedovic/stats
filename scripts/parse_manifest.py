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
                    "title": passenger_match.group(3),
                    "isInfant": passenger_match.group(2) is not None,
                    "confirmationDate": passenger_match.group(4),
                    "fareClass": passenger_match.group(5),
                    "passengerId": passenger_match.group(6),
                    "seatNumber": passenger_match.group(8),
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
                        "title": title,
                        "isInfant": companion_match.group(2) is not None,
                        "confirmationDate": None,
                        "fareClass": None,
                        "passengerId": passenger_id,
                        "seatNumber": seat,
                        "flightStatus": flight_status,
                    }
                )

    return passengers


def extract_passengers_from_xps(content):
    """
    Extract passenger list from Wizz Air XPS/OXPS table exports.
    """
    passengers = []

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

        passenger_name, title, is_infant = normalize_xps_name(raw_name)
        passengers.append(
            {
                "lineNumber": int(line_no),
                "passengerName": passenger_name,
                "title": title,
                "isInfant": is_infant,
                "confirmationDate": None,
                "fareClass": locator,
                "passengerId": locator,
                "seatNumber": normalize_blank(seat_no),
                "sequenceNumber": normalize_blank(sequence_no),
                "flightStatus": normalize_blank(special_info),
            }
        )

    return passengers


def normalize_xps_name(raw_name):
    compact = re.sub(r"\s+", "", raw_name.upper())
    compact = compact.replace(" ", "")

    is_infant = compact.endswith("+I")
    if is_infant:
        compact = compact[:-2]

    title = "MR"
    title_suffixes = [
        ("CHD*C", "CHD"),
        ("CHD", "CHD"),
        ("INF", "INF"),
        ("MRS", "MRS"),
        ("MS", "MS"),
        ("MR", "MR"),
    ]

    for suffix, mapped_title in title_suffixes:
        if compact.endswith(suffix):
            compact = compact[: -len(suffix)]
            title = mapped_title
            break

    return compact, title, is_infant


def normalize_blank(value):
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
