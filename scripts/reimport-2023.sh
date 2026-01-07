#!/bin/bash

echo "🔄 Re-importing 2023 flight data"
echo ""

# Delete old 2023 flights
echo "🗑️  Deleting old 2023 flights..."
npx tsx -e "
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const deleted = await prisma.flight.deleteMany({
    where: {
      date: {
        gte: new Date('2023-01-01'),
        lte: new Date('2023-12-31')
      }
    }
  });

  console.log(\`✓ Deleted \${deleted.count} old flights\`);
  await prisma.\$disconnect();
}

main();
"

echo ""
echo "📥 Importing 2023 flights from JSON..."
npx tsx scripts/import-flights.ts output/2023-flights-data.json 2023

echo ""
echo "✅ 2023 data re-imported!"
