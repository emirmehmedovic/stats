#!/usr/bin/env python3

import os

STATS_DIR = "/Users/emir_mw/stats/STATS/2025/Dnevni izvještaji"
month_folder = "12.DECEMBAR"
month_path = os.path.join(STATS_DIR, month_folder)

print(f"Checking: {month_path}")
print(f"Exists: {os.path.exists(month_path)}\n")

all_files = os.listdir(month_path)
print(f"All files ({len(all_files)}):")
for f in all_files:
    print(f"  - {f!r}")

print("\nFiltering for Excel files:")
xlsx_files = [f for f in all_files if f.endswith('.xlsx')]
print(f"  Found {len(xlsx_files)} .xlsx files:")
for f in xlsx_files:
    print(f"    - {f}")

print("\nFiltering for pattern 'Dnevni izvještaj o saobraćaju':")
pattern_files = [
    f for f in all_files
    if 'Dnevni izvještaj o saobraćaju' in f and f.endswith('.xlsx')
]
print(f"  Found {len(pattern_files)} matching files:")
for f in pattern_files:
    print(f"    - {f}")

# Try alternate pattern
print("\nTrying pattern 'Dnevni izvje':")
alt_files = [
    f for f in all_files
    if 'Dnevni izvje' in f and f.endswith('.xlsx')
]
print(f"  Found {len(alt_files)} matching files:")
for f in alt_files:
    print(f"    - {f}")
