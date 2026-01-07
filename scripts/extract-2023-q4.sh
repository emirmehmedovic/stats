#!/bin/bash

echo "🚀 Extracting Q4 2023 data (Oct, Nov, Dec)"
echo ""

# Extract flights for Oct, Nov, Dec 2023
echo "📊 Step 1: Extracting flights from Excel files..."
python3 scripts/extract-flights.py 2023

echo ""
echo "✅ Extraction complete!"
echo ""
echo "📁 Output files:"
echo "  - output/flights-2023.json"
