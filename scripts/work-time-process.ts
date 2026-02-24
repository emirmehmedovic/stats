import 'dotenv/config';

const API_URL = process.env.WORK_TIME_API_URL || 'http://localhost:3000/api/work-time/process';
const API_KEY = process.env.WORK_TIME_API_KEY || process.env.ACCESS_CONTROL_API_KEY;

if (!API_KEY) {
  console.error('WORK_TIME_API_KEY or ACCESS_CONTROL_API_KEY is required.');
  process.exit(1);
}

function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const startDateEnv = process.env.START_DATE;
const endDateEnv = process.env.END_DATE;

const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);

const startDate = startDateEnv || formatDate(yesterday);
const endDate = endDateEnv || startDate;

const payload = {
  startDate,
  endDate,
  dryRun: process.env.DRY_RUN === 'true',
  rebuild: process.env.REBUILD === 'true',
};

async function run() {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  const text = await response.text();
  if (!response.ok) {
    console.error(`Work-time process failed: ${response.status} ${text}`);
    process.exit(1);
  }

  console.log(text);
}

run().catch((error) => {
  console.error('Work-time process error:', error);
  process.exit(1);
});
