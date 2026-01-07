#!/bin/bash

# Script to extract, compare, and add missing airlines and aircraft types

set -e

YEARS=("$@")

if [ ${#YEARS[@]} -eq 0 ]; then
  YEARS=("2024" "2025")
fi

echo "🔍 Preparing Missing Data for Years: ${YEARS[*]}"
echo "=" | head -c 80
echo ""
echo ""

# Step 1: Extract all airlines and aircraft from Excel files
echo "Step 1/3: Extracting data from Excel files..."
python3 scripts/extract-missing-data.py "${YEARS[@]}"
echo ""

if [ ! -f "output/extracted-master-data.json" ]; then
  echo "❌ Extraction failed"
  exit 1
fi

# Step 2: Compare with database
echo "Step 2/3: Comparing with database..."
npx tsx scripts/compare-with-database.ts
echo ""

# Step 3: Ask user if they want to add missing data
echo ""
echo "Step 3/3: Add missing data to database?"
echo "⚠️  This will add airlines and aircraft types with placeholder values."
echo ""
read -p "Add missing data now? (yes/no): " confirm

if [ "$confirm" = "yes" ] || [ "$confirm" = "y" ]; then
  npx tsx scripts/add-missing-data.ts --auto
  echo ""
  echo "✅ Missing data added!"
  echo ""
  echo "💡 Next steps:"
  echo "   1. Review in Prisma Studio: npx prisma studio"
  echo "   2. Update aircraft capacities if needed"
  echo "   3. Run import: ./scripts/import-multi-year.sh ${YEARS[*]}"
else
  echo ""
  echo "⏭️  Skipped adding data"
  echo ""
  echo "💡 To add manually:"
  echo "   1. Review generated files in output/ folder"
  echo "   2. Run: npx tsx scripts/add-missing-data.ts"
  echo "   3. Or use: npx prisma studio"
fi
