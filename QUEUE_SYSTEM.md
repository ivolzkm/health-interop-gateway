# Redis-Based Queue System Documentation

## Overview

The Health Interoperability Gateway includes a robust **asynchronous message processing system** powered by **Redis** and **BullMQ**. This system ensures high-throughput processing of healthcare data integration messages with automatic retry logic, failure tracking, and comprehensive monitoring.

## Architecture

### Components

1. **Redis Server** - In-memory data store for queue management
2. **BullMQ** - Job queue library built on Redis
3. **Job Processor** - Worker that processes integration messages
4. **Queue Monitor** - Dashboard for real-time queue monitoring
5. **Dead Letter Queue** - Tracks permanently failed jobs

### Processing Flow

```
┌─────────────────┐
│  API Request    │
│ (receiveMessage)│
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────┐
│ Create Integration Message Job  │
│ (with useQueue: true)           │
└────────┬────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│ Submit to Redis Queue            │
│ (integration-messages queue)     │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│ Return Immediately to Client     │
│ (messageId, status: 'queued')    │
└──────────────────────────────────┘
         │
         ▼ (Async Processing)
┌──────────────────────────────────┐
│ Worker Processes Job             │
│ - Validate mapping               │
│ - Transform to FHIR              │
│ - Validate FHIR resource         │
│ - Update message status          │
└────────┬─────────────────────────┘
         │
    ┌────┴────┐
    │          │
    ▼          ▼
 SUCCESS    FAILURE
    │          │
    ▼          ▼
TRANSFORMED FAILED
  (retry)   (DLQ)
```

## Configuration

### Environment Variables

```bash
# Redis connection URL
REDIS_URL=redis://localhost:6379

# Data encryption key for message encryption
DATA_ENCRYPTION_KEY=your-32-char-encryption-key-here
```

### Queue Settings

Default configuration in `server/queue.ts`:

```typescript
const queueConfig = {
  name: 'integration-messages',
  concurrency: 5,              // Process 5 jobs concurrently
  maxAttempts: 3,              // Retry up to 3 times
  backoffDelay: 2000,          // Initial 2-second delay
  jobTimeout: 300000,          // 5-minute timeout per job
  removeCompletedAfter: 3600000 // Keep completed jobs for 1 hour
};
```

## API Usage

### Submitting Messages to Queue

#### Synchronous Processing (Original)

```bash
curl -X POST http://localhost:3000/api/trpc/integration.receiveMessage \
  -H "Content-Type: application/json" \
  -d '{
    "apiKey": "your-api-key",
    "mappingId": 1,
    "sourceData": {
      "id": "patient-123",
      "firstName": "João",
      "lastName": "Silva"
    },
    "useQueue": false
  }'
```

#### Asynchronous Processing (Queue)

```bash
curl -X POST http://localhost:3000/api/trpc/integration.receiveMessage \
  -H "Content-Type: application/json" \
  -d '{
    "apiKey": "your-api-key",
    "mappingId": 1,
    "sourceData": {
      "id": "patient-123",
      "firstName": "João",
      "lastName": "Silva"
    },
    "useQueue": true
  }'
```

**Response:**

```json
{
  "messageId": "msg_abc123def456",
  "status": "queued",
  "errors": [],
  "processingTime": 45
}
```

### Checking Job Status

```typescript
import { getJobStatus } from './server/queue';

const status = await getJobStatus('msg_abc123def456');
// Returns:
// {
//   id: 'msg_abc123def456',
//   status: 'completed' | 'failed' | 'active' | 'waiting',
//   progress: 0-100,
//   attempts: 1,
//   failedReason?: 'error message'
// }
```

### Getting Queue Statistics

```typescript
import { getQueueStats } from './server/queue';

const stats = await getQueueStats();
// Returns:
// {
//   active: 5,      // Currently processing
//   waiting: 12,    // In queue
//   completed: 1024,// Successfully processed
//   failed: 3,      // Failed permanently
//   delayed: 2      // Scheduled for retry
// }
```

### Retrying Failed Jobs

```typescript
import { retryFailedJob } from './server/queue';

const success = await retryFailedJob('job_id_here');
```

### Getting Failed Jobs

```typescript
import { getFailedJobs } from './server/queue';

const failedJobs = await getFailedJobs(50); // Get last 50 failed jobs
// Returns array of:
// {
//   id: 'job-123',
//   messageId: 'msg_abc123',
//   clientId: 1,
//   failedReason: 'Mapping not found',
//   failedAt: Date,
//   attempts: 3
// }
```

## Retry Logic

### Exponential Backoff

Failed jobs are automatically retried with exponential backoff:

- **Attempt 1**: Immediate
- **Attempt 2**: 2 seconds delay
- **Attempt 3**: 4 seconds delay
- **After 3 attempts**: Moved to Dead Letter Queue

### Retry Conditions

A job is retried if:
- The error is transient (e.g., temporary network issue)
- Maximum attempts (3) have not been exceeded
- The job hasn't timed out

### Permanent Failures

Jobs move to Dead Letter Queue if:
- All retry attempts exhausted
- Mapping configuration not found
- Invalid encryption key
- Unrecoverable validation errors

## Monitoring

### Queue Monitor Dashboard

Access the real-time queue monitor at `/queue`:

**Features:**
- Live queue statistics (active, waiting, completed, failed, delayed)
- Queue health status
- Failed jobs table with error details
- Queue configuration display
- Auto-refresh every 30 seconds

### Metrics Tracked

1. **Active Jobs** - Currently processing
2. **Waiting Jobs** - In queue, awaiting processing
3. **Completed Jobs** - Successfully processed
4. **Failed Jobs** - Permanently failed (Dead Letter Queue)
5. **Delayed Jobs** - Scheduled for retry
6. **Success Rate** - Percentage of successful completions
7. **Processing Time** - Average time per job

### Health Indicators

- **Healthy**: Low failure rate, queue processing smoothly
- **Busy**: High number of active jobs (>20)
- **Warning**: High failure rate (>10% of completed jobs)

## Job Data Structure

```typescript
interface IntegrationJobData {
  messageId: string;           // Unique message identifier
  clientId: number;            // Healthcare organization ID
  mappingId: number;           // Data mapping configuration ID
  sourceData: Record<string, unknown>; // Original healthcare data
  encryptionKey: string;       // Key for data encryption
  ipAddress?: string;          // Client IP address (audit)
  userAgent?: string;          // Client user agent (audit)
}
```

## Error Handling

### Common Errors

| Error | Cause | Resolution |
|-------|-------|-----------|
| `Mapping not found` | Invalid mappingId | Verify mapping exists and is active |
| `Invalid API key` | Wrong or expired API key | Check API key configuration |
| `Encryption error` | Invalid encryption key | Verify DATA_ENCRYPTION_KEY environment variable |
| `FHIR validation failed` | Data doesn't match FHIR schema | Check source data format against mapping rules |
| `Redis connection failed` | Redis server unavailable | Ensure Redis is running and REDIS_URL is correct |

### Error Alerts

When a job fails, an alert is automatically created:

```typescript
{
  clientId: 1,
  messageId: 'msg_abc123',
  alertType: 'processing_error',
  severity: 'high',
  title: 'Message processing error',
  description: 'Detailed error message',
  isResolved: false
}
```

## Performance Tuning

### Concurrency

Adjust worker concurrency in `server/queue.ts`:

```typescript
const worker = new Worker('integration-messages', async (job) => {
  // ...
}, {
  connection: redis,
  concurrency: 10, // Increase for more parallel processing
});
```

**Recommendation:** Start with 5 and increase based on CPU/memory availability.

### Job Timeout

Modify timeout for long-running transformations:

```typescript
defaultJobOptions: {
  timeout: 600000, // 10 minutes instead of 5
}
```

### Cleanup Schedule

Automatically clean old jobs:

```typescript
// Run cleanup daily at 2 AM
setInterval(async () => {
  await cleanupOldJobs(86400000 * 7); // Clean jobs older than 7 days
}, 24 * 60 * 60 * 1000);
```

## Production Deployment

### Redis Setup

**Docker Compose:**

```yaml
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes
    environment:
      - REDIS_PASSWORD=your-secure-password

volumes:
  redis_data:
```

**Environment Variables:**

```bash
REDIS_URL=redis://:your-secure-password@redis-host:6379
```

### Monitoring in Production

1. **Redis Monitoring**: Use `redis-cli MONITOR` for real-time commands
2. **Queue Metrics**: Export to Prometheus/Grafana
3. **Alerts**: Set up alerts for:
   - High failure rate (>5%)
   - Queue backlog (>1000 waiting jobs)
   - Worker crashes
   - Redis connection failures

### Scaling

For high-volume deployments:

1. **Multiple Workers**: Run multiple worker instances
2. **Redis Cluster**: Use Redis Cluster for redundancy
3. **Job Prioritization**: Assign priorities to critical messages
4. **Rate Limiting**: Implement client-side rate limiting

## Testing

### Unit Tests

Run tests for queue system:

```bash
pnpm test server/queue.test.ts
```

### Integration Tests

Test with real Redis:

```bash
# Start Redis
docker run -d -p 6379:6379 redis:7-alpine

# Run integration tests
pnpm test:integration
```

### Load Testing

Simulate high-volume message processing:

```typescript
// Load test script
for (let i = 0; i < 1000; i++) {
  await submitIntegrationJob({
    messageId: `msg_load_${i}`,
    clientId: 1,
    mappingId: 1,
    sourceData: { id: `patient-${i}` },
    encryptionKey: 'test-key',
  });
}
```

## Troubleshooting

### Queue Not Processing

1. Check Redis connection: `redis-cli ping`
2. Verify worker is running: Check logs for `[Worker] Job processor registered`
3. Check job status: `await getJobStatus(jobId)`

### High Failure Rate

1. Review error messages in Dead Letter Queue
2. Check mapping configuration validity
3. Verify FHIR schema compatibility
4. Check encryption key configuration

### Memory Issues

1. Reduce concurrency setting
2. Increase job cleanup frequency
3. Monitor Redis memory usage: `redis-cli INFO memory`
4. Consider Redis Cluster for distribution

### Slow Processing

1. Check worker CPU/memory usage
2. Increase concurrency if resources available
3. Profile job processing time
4. Optimize mapping rules

## References

- [BullMQ Documentation](https://docs.bullmq.io/)
- [Redis Documentation](https://redis.io/documentation)
- [HL7 FHIR R4 Specification](https://www.hl7.org/fhir/r4/)
- [LGPD Compliance Guide](https://www.gov.br/cidadania/pt-br/acesso-a-informacao/lgpd)
