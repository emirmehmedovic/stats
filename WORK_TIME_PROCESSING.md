# Work Time Processing (Cron / Manual)

## Manual run (yesterday by default)
```bash
cd /Users/emir_mw/stats
WORK_TIME_API_KEY=your-api-key npm run work-time:process
```

## Manual range
```bash
cd /Users/emir_mw/stats
WORK_TIME_API_KEY=your-api-key START_DATE=2026-01-01 END_DATE=2026-02-11 npm run work-time:process
```

## Rebuild (delete & recompute range)
```bash
curl -X POST http://localhost:3000/api/work-time/process \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"startDate":"2026-01-01","endDate":"2026-02-11","rebuild":true}'
```

## Rebuild via script
```bash
cd /Users/emir_mw/stats
WORK_TIME_API_KEY=your-api-key START_DATE=2026-01-01 END_DATE=2026-02-11 REBUILD=true npm run work-time:process
```

## Dry run
```bash
cd /Users/emir_mw/stats
WORK_TIME_API_KEY=your-api-key DRY_RUN=true npm run work-time:process
```

## Cron (daily at 01:45)
```cron
45 1 * * * cd /Users/emir_mw/stats && WORK_TIME_API_KEY=your-api-key /usr/local/bin/npm run work-time:process >> /var/log/work-time-process.log 2>&1
```
