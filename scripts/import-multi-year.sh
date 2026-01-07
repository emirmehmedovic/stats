#!/bin/bash

# Script to extract and import multiple years of flight data

set -e  # Exit on error

YEARS=("$@")

if [ ${#YEARS[@]} -eq 0 ]; then
  echo "Usage: ./scripts/import-multi-year.sh <year1> [year2] [year3] ..."
  echo ""
  echo "Examples:"
  echo "  ./scripts/import-multi-year.sh 2024"
  echo "  ./scripts/import-multi-year.sh 2023 2024"
  echo "  ./scripts/import-multi-year.sh 2023 2024 2025"
  exit 1
fi

echo "🚀 Multi-Year Flight Data Import"
echo "================================="
echo ""
echo "Years to process: ${YEARS[*]}"
echo ""

for YEAR in "${YEARS[@]}"; do
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "📅 Processing Year: $YEAR"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""

  # Step 1: Extract data from Excel
  echo "Step 1/3: Extracting data from Excel..."
  python3 scripts/extract-flights.py "$YEAR"

  if [ ! -f "output/${YEAR}-flights-data.json" ]; then
    echo "❌ Extraction failed for $YEAR - JSON file not created"
    exit 1
  fi

  echo "✅ Extraction complete"
  echo ""

  # Step 2: Import to database
  echo "Step 2/3: Importing to database..."
  npx tsx scripts/import-year.ts "$YEAR"

  echo "✅ Import complete"
  echo ""

  # Step 3: Calculate load factors
  echo "Step 3/3: Calculating load factors..."
  npx tsx scripts/calculate-load-factors.ts

  echo "✅ Load factors calculated"
  echo ""
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ All years processed successfully!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Show final database statistics
echo "📊 Final database statistics:"
echo ""
npx tsx -e "
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

(async () => {
  const totalFlights = await prisma.flight.count();
  const years = await prisma.\$queryRaw\`
    SELECT EXTRACT(YEAR FROM date) as year, COUNT(*) as count
    FROM \"Flight\"
    GROUP BY EXTRACT(YEAR FROM date)
    ORDER BY year DESC
  \`;

  console.log('   Total flights:', totalFlights);
  console.log('');
  console.log('   Breakdown by year:');
  for (const row of years) {
    console.log(\`     \${row.year}: \${row.count} flights\`);
  }

  await prisma.\$disconnect();
})();
"
