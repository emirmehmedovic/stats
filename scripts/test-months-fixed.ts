#!/usr/bin/env npx tsx

import { eachMonthOfInterval } from 'date-fns';
import { startOfDayUtc, endOfDayUtc, dateStringFromParts, formatDateDisplay } from '../src/lib/dates';

const year = 2024;
const yearStart = startOfDayUtc(dateStringFromParts(year, 1, 1));
const yearEnd = endOfDayUtc(dateStringFromParts(year, 12, 31));

console.log('Year:', year);
console.log('Start:', yearStart.toISOString());
console.log('End:', yearEnd.toISOString());
console.log('');

const monthsInYear = eachMonthOfInterval({ start: yearStart, end: yearEnd });
console.log(`Months before filter: ${monthsInYear.length}`);

// Filter out months that don't belong to the target year (timezone issues can cause extra months)
const monthsFiltered = monthsInYear.filter((month) => {
  const utcYear = month.getUTCFullYear();
  return utcYear === year;
});

console.log('');
console.log('Months after filtering:');
monthsFiltered.forEach((month, idx) => {
  console.log(`  ${idx + 1}. ${formatDateDisplay(month)} (Month ${month.getUTCMonth() + 1})`);
});

console.log('');
console.log(`Total months after filter: ${monthsFiltered.length}`);
console.log('Expected: 12');
console.log(monthsFiltered.length === 12 ? '✅ CORRECT' : '❌ WRONG');
