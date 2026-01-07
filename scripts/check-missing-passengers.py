#!/usr/bin/env python3

import json

with open('output/2025-flights-data.json', 'r') as f:
    data = json.load(f)

total_flights = len(data['flights'])
missing_arrival = 0
missing_departure = 0
missing_both = 0
has_data = 0

for flight in data['flights']:
    arr = flight.get('arrivalPassengers')
    dep = flight.get('departurePassengers')

    if arr is None and dep is None:
        missing_both += 1
    elif arr is None:
        missing_arrival += 1
    elif dep is None:
        missing_departure += 1
    else:
        has_data += 1

print(f"📊 Passenger Data Completeness\n")
print(f"Total flights: {total_flights}\n")
print(f"  ✅ Both arrival & departure: {has_data} ({has_data/total_flights*100:.1f}%)")
print(f"  ⚠️  Missing arrival only: {missing_arrival}")
print(f"  ⚠️  Missing departure only: {missing_departure}")
print(f"  ❌ Missing both: {missing_both}")
print()

# Show examples of flights with missing data
print("Examples of flights with missing passenger data:\n")
count = 0
for flight in data['flights']:
    arr = flight.get('arrivalPassengers')
    dep = flight.get('departurePassengers')

    if arr is None or dep is None:
        print(f"  {flight['date']} - {flight['airline']} - {flight['route']}")
        print(f"    Arrival: {arr}, Departure: {dep}")
        count += 1
        if count >= 10:
            break
