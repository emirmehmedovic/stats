#!/usr/bin/env python3

import json
from datetime import datetime

# Expected totals from user (adults + children, NOT including infants)
expected = {
    1: 20748,
    2: 17839,
    3: 22724,
    4: 21827,
    5: 21866,
    6: 31637,
    7: 38214,
    8: 42087,
    9: 34390,
    10: 32977,
    11: 21934,
}

# Load extracted data
with open('output/2025-flights-data.json', 'r') as f:
    data = json.load(f)

# Calculate per-month totals
month_stats = {}

for flight in data['flights']:
    date_str = flight['date']
    date = datetime.fromisoformat(date_str)
    month = date.month

    if month not in month_stats:
        month_stats[month] = {
            'flights': 0,
            'arrival': 0,
            'departure': 0,
            'arrival_infants': 0,
            'departure_infants': 0,
        }

    month_stats[month]['flights'] += 1
    month_stats[month]['arrival'] += flight.get('arrivalPassengers') or 0
    month_stats[month]['departure'] += flight.get('departurePassengers') or 0
    month_stats[month]['arrival_infants'] += flight.get('arrivalInfants') or 0
    month_stats[month]['departure_infants'] += flight.get('departureInfants') or 0

# Print comparison
print("\n📊 Passenger Count Verification (Adults + Children, NO infants)\n")
print("="*80)
print(f"{'Month':<12} {'Flights':>8} {'Expected':>10} {'Actual':>10} {'Diff':>10} {'Status':>8}")
print("="*80)

total_expected = 0
total_actual = 0

for month in sorted(month_stats.keys()):
    stats = month_stats[month]
    actual = stats['arrival'] + stats['departure']
    exp = expected.get(month, 0)
    diff = actual - exp
    status = "✅" if abs(diff) < 100 else "❌"

    month_names = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                   'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

    print(f"{month_names[month]:<12} {stats['flights']:>8} {exp:>10,} {actual:>10,} {diff:>+10,} {status:>8}")

    total_expected += exp
    total_actual += actual

print("="*80)
print(f"{'TOTAL':<12} {len(data['flights']):>8} {total_expected:>10,} {total_actual:>10,} {total_actual - total_expected:>+10,}")
print("="*80)

# Show infant totals
print(f"\n📊 Infant Counts (NOT included in totals above):\n")
print("="*80)
print(f"{'Month':<12} {'Arrival':>10} {'Departure':>10} {'Total':>10}")
print("="*80)

total_infants = 0
for month in sorted(month_stats.keys()):
    stats = month_stats[month]
    month_names = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                   'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    arr_inf = stats['arrival_infants']
    dep_inf = stats['departure_infants']
    tot_inf = arr_inf + dep_inf
    print(f"{month_names[month]:<12} {arr_inf:>10,} {dep_inf:>10,} {tot_inf:>10,}")
    total_infants += tot_inf

print("="*80)
print(f"{'TOTAL':<12} {' ':>10} {' ':>10} {total_infants:>10,}")
print("="*80)
