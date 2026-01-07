#!/usr/bin/env python3

import openpyxl
import os
import re
from datetime import datetime

STATS_DIR = "/Users/emir_mw/stats/STATS/2025/Dnevni izvještaji"
month_path = os.path.join(STATS_DIR, "03. MART")

def parse_route(route):
    """Parse route like 'TZL-AYT' and return [departure, arrival]"""
    if not route or route == '-' or route == 'N/A':
        return None

    parts = [p.strip() for p in route.split('-') if p.strip()]

    if len(parts) >= 2:
        return {
            'departure': parts[0],
            'arrival': parts[-1],
        }

    return None

files = [
    f for f in os.listdir(month_path)
    if 'Dnevni izvještaj o saobraćaju' in f and f.endswith('.xlsx')
]

file_path = os.path.join(month_path, files[0])
wb = openpyxl.load_workbook(file_path, read_only=True, data_only=True)

print("📊 Debug March Extraction\n")

# Process sheet 02 and 03 to see what's happening
for sheet_name in ['02', '03']:
    print(f"\n{'='*80}")
    print(f"Processing sheet '{sheet_name}'")
    print('='*80)

    ws = wb[sheet_name]

    for i, row in enumerate(ws.iter_rows(values_only=True), 1):
        if i == 1:
            print("  [Row 1] Header - SKIP")
            continue

        if not row[0]:
            if i <= 10:
                print(f"  [Row {i}] Empty row - SKIP")
            continue

        route_str = row[3] if len(row) > 3 else None
        route = parse_route(str(route_str))

        if route:
            print(f"  [Row {i}] ✅ Route '{route_str}' -> {route}")
        else:
            print(f"  [Row {i}] ❌ Route '{route_str}' FAILED to parse")

wb.close()
