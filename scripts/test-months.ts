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

console.log('Months from eachMonthOfInterval:');
monthsInYear.forEach((month, idx) => {
  console.log(`  ${idx + 1}. ${month.toISOString()} -> ${formatDateDisplay(month)}`);
  console.log(`     UTC Month: ${month.getUTCMonth() + 1}, UTC Date: ${month.getUTCDate()}`);
});

console.log('');
console.log(`Total months: ${monthsInYear.length}`);
console.log('Expected: 12');
