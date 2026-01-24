import { Queue, Worker } from 'bullmq';
import { createClient } from 'redis';
import { getDb, updateIntegrationMessage, createAlert } from './db';
import { encryptData } from './encryption';
import { mapData } from './mapping-engine';
import { validateFhirResource } from './fhir-validator';

/**
 * Queue Management System
 * Handles asynchronous processing of healthcare data integration messages
 * with automatic retry logic and dead letter queue support
 */

let redisClient: any = null;
let integrationQueue: Queue | null = null;

/**
 * Initialize Redis connection
 */
export async function initializeRedis(): Promise<any> {
  if (redisClient) {
    return redisClient;
  }

  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

  try {
    redisClient = createClient({
      url: redisUrl,
      socket: {
        reconnectStrategy: (retries: number) => Math.min(retries * 50, 500),
      },
    });

    redisClient.on('error', (err: Error) => console.error('[Redis] Error:', err));
    redisClient.on('connect', () => console.log('[Redis] Connected'));
    redisClient.on('ready', () => console.log('[Redis] Ready'));

    await redisClient.connect();
    return redisClient;
  } catch (error) {
    console.error('[Redis] Failed to initialize:', error);
    throw error;
  }
}

/**
 * Get or create the integration message queue
 */
export async function getIntegrationQueue(): Promise<Queue> {
  if (integrationQueue) {
    return integrationQueue;
  }

  const redis = await initializeRedis();

  integrationQueue = new Queue('integration-messages', {
    connection: redis,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: {
        age: 3600, // Keep completed jobs for 1 hour
      },
      removeOnFail: false, // Keep failed jobs for analysis
    },
  });

  return integrationQueue;
}

/**
 * Job data structure for integration messages
 */
export interface IntegrationJobData {
  messageId: string;
  clientId: number;
  mappingId: number;
  sourceData: Record<string, unknown>;
  encryptionKey: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Submit a message to the integration queue
 */
export async function submitIntegrationJob(
  data: IntegrationJobData,
  priority?: number
): Promise<string> {
  const queue = await getIntegrationQueue();

  try {
    const job = await queue.add('process-message', data, {
      priority: priority || 0,
      jobId: data.messageId,
    });

    console.log(`[Queue] Job submitted: ${data.messageId}`);
    return job.id || data.messageId;
  } catch (error) {
    console.error('[Queue] Failed to submit job:', error);
    throw error;
  }
}

/**
 * Process integration message job
 */
export async function processIntegrationMessage(data: IntegrationJobData): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error('Database not available');
  }

  const { messageId, clientId, mappingId, sourceData, encryptionKey } = data;

  try {
    console.log(`[Queue] Processing message: ${messageId}`);

    // Retrieve mapping configuration
    const { getDataMappingById } = await import('./db');
    const mapping = await getDataMappingById(mappingId);

    if (!mapping) {
      throw new Error(`Mapping not found: ${mappingId}`);
    }

    // Encrypt source data
    const encryptedData = encryptData(JSON.stringify(sourceData), encryptionKey);

    // Parse mapping rules
    const mappingRules = JSON.parse(mapping.mappingRules);
    const mappingConfig = {
      sourceFormat: mapping.sourceFormat,
      targetFormat: mapping.targetFormat,
      rules: mappingRules,
    };

    // Transform data to FHIR
    const { data: fhirData, errors: mappingErrors } = mapData(sourceData, mappingConfig);

    // Validate FHIR data
    const resourceType = mapping.targetFormat.split('_').pop() || 'Resource';
    const validationResult = validateFhirResource(resourceType, fhirData);

    const allErrors = [...mappingErrors, ...validationResult.errors.map(e => `${e.field}: ${e.message}`)];

    // Update message status
    await updateIntegrationMessage(messageId, {
      sourceData: JSON.stringify(encryptedData),
      fhirData: validationResult.isValid ? JSON.stringify(fhirData) : null,
      status: validationResult.isValid ? 'transformed' : 'failed',
      validationErrors: allErrors.length > 0 ? JSON.stringify(allErrors) : null,
      processedAt: new Date(),
    });

    // Create alert if there are errors
    if (allErrors.length > 0) {
      await createAlert({
        clientId,
        messageId,
        alertType: 'validation_error',
        severity: validationResult.isValid ? 'low' : 'high',
        title: `Data validation ${validationResult.isValid ? 'warning' : 'error'}`,
        description: `Message ${messageId} had ${allErrors.length} validation issue(s)`,
        details: JSON.stringify(allErrors),
        isResolved: false,
      });
    }

    console.log(`[Queue] Message processed successfully: ${messageId}`);
  } catch (error) {
    console.error(`[Queue] Error processing message ${messageId}:`, error);

    // Create error alert
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await createAlert({
      clientId,
      messageId,
      alertType: 'processing_error',
      severity: 'high',
      title: 'Message processing error',
      description: errorMessage,
      isResolved: false,
    });

    throw error; // Re-throw to trigger retry
  }
}

/**
 * Register job processor
 */
export async function registerJobProcessor(): Promise<void> {
  const queue = await getIntegrationQueue();
  const redis = await initializeRedis();

  const worker = new Worker('integration-messages', async (job) => {
    const data = job.data as IntegrationJobData;
    await processIntegrationMessage(data);
  }, {
    connection: redis,
    concurrency: 5, // Process 5 jobs concurrently
  });

  worker.on('completed', (job) => {
    console.log(`[Worker] Job completed: ${job.id}`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[Worker] Job failed: ${job?.id}, Error: ${err.message}`);
  });

  worker.on('error', (err) => {
    console.error('[Worker] Worker error:', err);
  });

  console.log('[Worker] Job processor registered');
}

/**
 * Get job status
 */
export async function getJobStatus(jobId: string): Promise<{
  id: string;
  status: string;
  progress: number;
  attempts: number;
  failedReason?: string;
  data?: IntegrationJobData;
} | null> {
  const queue = await getIntegrationQueue();

  try {
    const job = await queue.getJob(jobId);
    if (!job) {
      return null;
    }

    const state = await job.getState();
    // BullMQ progress is stored as a property
    let progress = 0;
    const progressData = (job as any).progress;
    if (typeof progressData === 'number') {
      progress = progressData;
    } else if (progressData && typeof progressData === 'object' && 'value' in progressData) {
      progress = (progressData as any).value || 0;
    }
    
    const failedReason = job.failedReason;

    return {
      id: job.id || jobId,
      status: state,
      progress: progress,
      attempts: job.attemptsMade,
      failedReason: failedReason || undefined,
      data: job.data as IntegrationJobData,
    };
  } catch (error) {
    console.error('[Queue] Error getting job status:', error);
    return null;
  }
}

/**
 * Get queue statistics
 */
export async function getQueueStats(): Promise<{
  active: number;
  waiting: number;
  completed: number;
  failed: number;
  delayed: number;
}> {
  const queue = await getIntegrationQueue();

  try {
    const counts = await queue.getJobCounts();
    return {
      active: counts.active || 0,
      waiting: counts.waiting || 0,
      completed: counts.completed || 0,
      failed: counts.failed || 0,
      delayed: counts.delayed || 0,
    };
  } catch (error) {
    console.error('[Queue] Error getting queue stats:', error);
    return {
      active: 0,
      waiting: 0,
      completed: 0,
      failed: 0,
      delayed: 0,
    };
  }
}

/**
 * Get failed jobs (dead letter queue)
 */
export async function getFailedJobs(limit: number = 50): Promise<Array<{
  id: string;
  messageId: string;
  clientId: number;
  failedReason: string;
  failedAt: Date;
  attempts: number;
}>> {
  const queue = await getIntegrationQueue();

  try {
    const failedJobs = await queue.getFailed(0, limit - 1);
    return failedJobs.map(job => ({
      id: job.id || '',
      messageId: (job.data as IntegrationJobData).messageId,
      clientId: (job.data as IntegrationJobData).clientId,
      failedReason: job.failedReason || 'Unknown',
      failedAt: new Date(job.finishedOn || 0),
      attempts: job.attemptsMade,
    }));
  } catch (error) {
    console.error('[Queue] Error getting failed jobs:', error);
    return [];
  }
}

/**
 * Retry a failed job
 */
export async function retryFailedJob(jobId: string): Promise<boolean> {
  const queue = await getIntegrationQueue();

  try {
    const job = await queue.getJob(jobId);
    if (!job) {
      return false;
    }

    await job.retry();
    console.log(`[Queue] Job retried: ${jobId}`);
    return true;
  } catch (error) {
    console.error('[Queue] Error retrying job:', error);
    return false;
  }
}

/**
 * Clean up old jobs
 */
export async function cleanupOldJobs(maxAge: number = 86400000): Promise<number> {
  const queue = await getIntegrationQueue();

  try {
    const count = await queue.clean(maxAge, 1000, 'completed');
    console.log(`[Queue] Cleaned up ${count} old jobs`);
    return typeof count === 'number' ? count : 0;
  } catch (error) {
    console.error('[Queue] Error cleaning up jobs:', error);
    return 0;
  }
}

/**
 * Drain the queue (remove all jobs)
 */
export async function drainQueue(): Promise<void> {
  const queue = await getIntegrationQueue();

  try {
    await queue.drain();
    console.log('[Queue] Queue drained');
  } catch (error) {
    console.error('[Queue] Error draining queue:', error);
  }
}

/**
 * Close queue and Redis connection
 */
export async function closeQueue(): Promise<void> {
  if (integrationQueue) {
    await integrationQueue.close();
  }

  if (redisClient) {
    await redisClient.quit();
  }

  console.log('[Queue] Closed');
}
