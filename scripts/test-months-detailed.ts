#!/usr/bin/env npx tsx

import { eachMonthOfInterval } from 'date-fns';
import { startOfDayUtc, endOfDayUtc, dateStringFromParts, formatDateDisplay } from '../src/lib/dates';

const year = 2024;
const yearStart = startOfDayUtc(dateStringFromParts(year, 1, 1));
const yearEnd = endOfDayUtc(dateStringFromParts(year, 12, 31));

const monthsInYear = eachMonthOfInterval({ start: yearStart, end: yearEnd });

// Filter out months that don't belong to the target year (timezone issues can cause extra months)
const monthsFiltered = monthsInYear.filter((month) => {
  const utcYear = month.getUTCFullYear();
  return utcYear === year;
});

console.log('Detailed analysis of filtered months:\n');
monthsFiltered.forEach((month, idx) => {
  const utcMonth = month.getUTCMonth();
  const utcYear = month.getUTCFullYear();
  const monthNumber = month.getUTCMonth() + 1;

  console.log(`${idx + 1}. ISO: ${month.toISOString()}`);
  console.log(`   UTC Year: ${utcYear}, UTC Month (0-indexed): ${utcMonth}, Month Number: ${monthNumber}`);
  console.log(`   Display: ${formatDateDisplay(month)}`);
  console.log('');
});

console.log('Check for December 2024:');
const december = monthsFiltered.find(m => m.getUTCMonth() === 11 && m.getUTCFullYear() === 2024);
console.log(december ? '✅ December 2024 FOUND' : '❌ December 2024 MISSING');

const january2025 = monthsFiltered.find(m => m.getUTCMonth() === 0 && m.getUTCFullYear() === 2025);
console.log(january2025 ? '❌ January 2025 incorrectly included' : '✅ January 2025 correctly excluded');
