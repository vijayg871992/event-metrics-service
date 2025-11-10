# Event Metrics Service

A Node.js service that processes CSV event uploads, computes daily metrics, and provides query APIs.

## Tech Stack

- **Backend:** Node.js + TypeScript, Fastify
- **Database:** MongoDB
- **Queue:** BullMQ with Redis
- **Testing:** Jest

## Setup

### Prerequisites
- Node.js 18+
- MongoDB running locally | MongoDB Atlas
- Redis running locally or via Docker

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd Pro
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```env
MONGO_URI=YOUR_URL
REDIS_URL=REDIS_URL
PORT=3000
LOG_LEVEL=info
ADMIN_TOKEN=YourSecret
CLEANUP_INTERVAL_SECONDS=3600
CLEANUP_TTL_SECONDS=86400
UPLOAD_LIMIT=1
UPLOAD_WINDOW_SECONDS=60
```

4. Start Redis (if using Docker):
```bash
docker exec -it redis redis-cli
ping
```

5. Run the server:
```bash
npm run dev
```

6. Run tests:
```bash
npm test
```

## API Endpoints

### Simple UI Endpoint
http://localhost:3000/

### Upload CSV
```
POST /uploads
Content-Type: multipart/form-data

Response: { batch_id, inserted_count, failed_count, errors }
```

### Process Batch
```
POST /batches/:id/process

Response: { message, batchId }
```

### Get Metrics
```
GET /metrics?date=2025-11-10
GET /metrics?from=2025-11-01
GET /metrics?from=2025-11-01&to=2025-11-10
GET /metrics?event_type=test_started
GET /metrics?from=2025-11-01&to=2025-11-10&event_type=test_started

Response: { count, data: [{ date, metrics }] }
```

### View Failed Jobs (Admin)
```
GET /admin/queues/event-processing/dlq

Response: { queue, failed_count, jobs }
```

## Architecture

### Flow
1. **Upload** → CSV file validated, events stored in MongoDB, batch record created
2. **Process** → Job queued in BullMQ, worker processes batch and computes daily metrics
3. **Query** → Retrieve aggregated metrics by date or event type

### Key Components

**Controllers**
- `uploadController.ts` - Handles CSV uploads with validation
- `batchController.ts` - Enqueues batch processing jobs
- `metricsController.ts` - Queries daily metrics
- `queueController.ts` - Admin endpoint for failed jobs

**Workers**
- `eventJob.ts` - Processes batches, computes metrics (concurrency: 2, retry: 3x exponential backoff)
- `cleanupJob.ts` - Removes old unprocessed events and batches
- `reprocessDailyMetrics.ts` - Midnight job to recompute all metrics

**Models**
- `Event` - Stores individual events with indexes on batch_id + event_id
- `Batch` - Tracks upload status (uploaded → queued → processing → completed/failed)
- `DailyMetrics` - Aggregated counts per date and event_type

**Utils**
- `csvParser.ts` - Streams CSV parsing
- `rateLimiter.ts` - Redis-based rate limiting (1 upload/minute per IP)
- `queue.ts` - BullMQ queue configuration

### Database Indexes
- **Events:** `{ batch_id: 1, event_id: 1 }` (unique)
- **Batches:** `{ batch_id: 1 }` (unique)
- **DailyMetrics:** `{ date: 1 }` (unique), `{ date: 1, metrics.event_type: 1 }`

## Tradeoffs

- **Simple validation:** Check required fields only. Keeps upload fast but doesn't validate data formats deeply.
- **BullMQ for reliability:** Jobs retry automatically and failed jobs go to DLQ. Adds Redis dependency but ensures no data loss.
- **Separate process endpoint:** Upload and processing are decoupled. Gives control but requires two API calls.
- **Daily aggregation only:** Metrics grouped by date. Simple to query but can't get hourly breakdowns.
- **Authentication:** Admin endpoint uses Bearer token auth. Simple but sufficient for this project.
- **Used proven tools** (Fastify, BullMQ, MongoDB) instead of custom solutions

## Testing

- **Unit tests:** CSV parsing, rate limiting, metrics computation
- **Integration test:** Full upload → process → query workflow

Run tests:
```bash
npm test
```

## Features Implemented

### Core Requirements 
- CSV upload with validation
- Batch processing with BullMQ
- Daily metrics computation
- Query endpoint with filters
- DLQ endpoint for failed jobs
- Structured logging
- Unit + integration tests

### Stretch Goals 
- Midnight reprocess job (repeatable)
- Upload rate limiting (1/min per IP)

---

Built using Node.js, TypeScript, and Fastify