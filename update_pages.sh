#!/bin/bash

# Script to update the remaining pages with MainLayout and new design system

# Array of files to update
files=(
  "/Users/emir_mw/stats/src/app/operation-types/page.tsx"
  "/Users/emir_mw/stats/src/app/delay-codes/page.tsx"
  "/Users/emir_mw/stats/src/app/airlines/page.tsx"
)

for file in "${files[@]}"; do
  echo "Processing $file..."

  # Add MainLayout import after existing imports
  sed -i '' "s/import { AircraftTypeModal } from '@\/components\/aircraft-types\/AircraftTypeModal';/import { AircraftTypeModal } from '@\/components\/aircraft-types\/AircraftTypeModal';\nimport { MainLayout } from '@\/components\/layout\/MainLayout';/" "$file" 2>/dev/null
  sed -i '' "s/import { OperationTypeModal } from '@\/components\/operation-types\/OperationTypeModal';/import { OperationTypeModal } from '@\/components\/operation-types\/OperationTypeModal';\nimport { MainLayout } from '@\/components\/layout\/MainLayout';/" "$file" 2>/dev/null
  sed -i '' "s/import { DelayCodeModal } from '@\/components\/delay-codes\/DelayCodeModal';/import { DelayCodeModal } from '@\/components\/delay-codes\/DelayCodeModal';\nimport { MainLayout } from '@\/components\/layout\/MainLayout';/" "$file" 2>/dev/null
  sed -i '' "s/import { AirlineModal } from '@\/components\/airlines\/AirlineModal';/import { AirlineModal } from '@\/components\/airlines\/AirlineModal';\nimport { MainLayout } from '@\/components\/layout\/MainLayout';/" "$file" 2>/dev/null

  # Replace slate colors with dark colors
  sed -i '' 's/text-slate-900/text-dark-900/g' "$file"
  sed -i '' 's/text-slate-600/text-dark-600/g' "$file"
  sed -i '' 's/text-slate-500/text-dark-500/g' "$file"
  sed -i '' 's/border-slate-200/border-dark-100/g' "$file"
  sed -i '' 's/border-slate-100/border-dark-100/g' "$file"
  sed -i '' 's/hover:bg-slate-50/hover:bg-dark-50/g' "$file"

  # Wrap return statement with MainLayout
  # This requires careful handling to not break existing structure

  echo "Completed $file"
done

echo "All files processed!"
