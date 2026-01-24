import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { nanoid } from "nanoid";
import { 
  getClientByApiKey, 
  createIntegrationMessage, 
  getIntegrationMessageById,
  updateIntegrationMessage,
  getMessagesByClient,
  getDataMappingsByClient,
  getDataMappingById,
  createAuditLog,
  getAuditLogsByClient,
  getAlertsByClient,
  createAlert,
  getClientStats,
  getOrCreateDailyStats,
  updateDailyStats,
} from "./db";
import { encryptData, decryptData } from "./encryption";
import { mapData, createPatientMappingConfig, createLabResultMappingConfig } from "./mapping-engine";
import { validateFhirResource, validateResourceStructure } from "./fhir-validator";
import { logMessageProcessing, logAuditAction } from "./audit";
import { submitIntegrationJob, getJobStatus, getQueueStats, getFailedJobs, retryFailedJob } from "./queue";
import type { Request } from "express";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  integration: router({
    receiveMessage: publicProcedure
      .input(z.object({
        apiKey: z.string(),
        mappingId: z.number(),
        sourceData: z.record(z.string(), z.unknown()),
        useQueue: z.boolean().optional().default(true),
      }))
      .mutation(async ({ input, ctx }) => {
        const startTime = Date.now();
        const messageId = nanoid();
        const req = ctx.req as Request;

        try {
          const client = await getClientByApiKey(input.apiKey);
          if (!client) {
            await logAuditAction(req, undefined, undefined, 'invalid_api_key', 'integration_message', messageId, 'Invalid API key provided');
            throw new Error('Invalid API key');
          }

          // If async queue is enabled, submit to queue and return immediately
          if (input.useQueue) {
            const encryptionKey = process.env.DATA_ENCRYPTION_KEY || 'default-key-change-in-production';
            const jobId = await submitIntegrationJob({
              messageId,
              clientId: client.id,
              mappingId: input.mappingId,
              sourceData: input.sourceData,
              encryptionKey,
              ipAddress: req.ip,
              userAgent: req.get('user-agent'),
            });

            await createIntegrationMessage({
              clientId: client.id,
              mappingId: input.mappingId,
              messageId,
              status: 'queued',
              sourceData: JSON.stringify(input.sourceData),
            });

            await logAuditAction(
              req,
              client.id,
              client.id,
              'message_queued',
              'integration_message',
              messageId,
              'Message queued for async processing'
            );

            return {
              messageId,
              status: 'queued',
              errors: [],
              processingTime: Date.now() - startTime,
            };
          }

          const mapping = await getDataMappingById(input.mappingId);
          if (!mapping || mapping.clientId !== client.id) {
            throw new Error('Mapping not found or unauthorized');
          }

          const encryptionKey = process.env.DATA_ENCRYPTION_KEY || 'default-key-change-in-production';
          const encryptedData = encryptData(JSON.stringify(input.sourceData), encryptionKey);

          const mappingRules = JSON.parse(mapping.mappingRules);
          const mappingConfig = {
            sourceFormat: mapping.sourceFormat,
            targetFormat: mapping.targetFormat,
            rules: mappingRules,
          };

          const { data: fhirData, errors: mappingErrors } = mapData(input.sourceData, mappingConfig);
          const resourceType = mapping.targetFormat.split('_').pop() || 'Resource';
          const validationResult = validateFhirResource(resourceType, fhirData);
          const allErrors = [...mappingErrors, ...validationResult.errors.map(e => `${e.field}: ${e.message}`)];

          await createIntegrationMessage({
            clientId: client.id,
            mappingId: input.mappingId,
            messageId,
            sourceData: JSON.stringify(encryptedData),
            fhirData: validationResult.isValid ? JSON.stringify(fhirData) : null,
            status: validationResult.isValid ? 'transformed' : 'failed',
            validationErrors: allErrors.length > 0 ? JSON.stringify(allErrors) : null,
            processedAt: new Date(),
          });

          await logMessageProcessing(req, client.id, messageId, validationResult.isValid ? 'success' : 'validation_failed', {
            mappingId: input.mappingId,
            errorCount: allErrors.length,
          });

          const today = new Date().toISOString().split('T')[0];
          const stats = await getOrCreateDailyStats(client.id, today);
          const processingTime = Date.now() - startTime;
          const newAvgTime = (stats.averageProcessingTime * stats.messagesProcessed + processingTime) / (stats.messagesProcessed + 1);
          await updateDailyStats(client.id, today, {
            messagesReceived: stats.messagesReceived + 1,
            messagesProcessed: validationResult.isValid ? stats.messagesProcessed + 1 : stats.messagesProcessed,
            messagesFailed: validationResult.isValid ? stats.messagesFailed : stats.messagesFailed + 1,
            averageProcessingTime: Math.round(newAvgTime),
          });

          if (allErrors.length > 0) {
            await createAlert({
              clientId: client.id,
              messageId: messageId,
              alertType: 'validation_error',
              severity: validationResult.isValid ? 'low' : 'high',
              title: `Data validation ${validationResult.isValid ? 'warning' : 'error'}`,
              description: `Message ${messageId} had ${allErrors.length} validation issue(s)`,
              details: JSON.stringify(allErrors),
              isResolved: false,
            });
          }

          return {
            messageId,
            status: validationResult.isValid ? 'success' : 'validation_failed',
            errors: allErrors,
            processingTime,
          };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          // Note: clientId is not available in error case, so we skip alert creation
          // or create a system-level alert
          throw error;
        }
      }),

    getMessageStatus: publicProcedure
      .input(z.object({
        apiKey: z.string(),
        messageId: z.string(),
      }))
      .query(async ({ input }) => {
        const client = await getClientByApiKey(input.apiKey);
        if (!client) throw new Error('Invalid API key');

        const message = await getIntegrationMessageById(input.messageId);
        if (!message || message.clientId !== client.id) {
          throw new Error('Message not found or unauthorized');
        }

        return {
          messageId: message.messageId,
          status: message.status,
          createdAt: message.createdAt,
          processedAt: message.processedAt,
          errors: message.validationErrors ? JSON.parse(message.validationErrors) : [],
        };
      }),
  }),

  dashboard: router({
    getStats: protectedProcedure
      .input(z.object({
        clientId: z.number(),
        days: z.number().default(30),
      }))
      .query(async ({ input, ctx }) => {
        if (ctx.user?.role !== 'admin') {
          throw new Error('Unauthorized');
        }
        return getClientStats(input.clientId, input.days);
      }),

    getRecentMessages: protectedProcedure
      .input(z.object({
        clientId: z.number(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      }))
      .query(async ({ input, ctx }) => {
        if (ctx.user?.role !== 'admin') {
          throw new Error('Unauthorized');
        }
        return getMessagesByClient(input.clientId, input.limit, input.offset);
      }),

    getAlerts: protectedProcedure
      .input(z.object({
        clientId: z.number(),
      }))
      .query(async ({ input, ctx }) => {
        if (ctx.user?.role !== 'admin') {
          throw new Error('Unauthorized');
        }
        return getAlertsByClient(input.clientId, true);
      }),

    getAuditLogs: protectedProcedure
      .input(z.object({
        clientId: z.number(),
        limit: z.number().default(100),
        offset: z.number().default(0),
      }))
      .query(async ({ input, ctx }) => {
        if (ctx.user?.role !== 'admin') {
          throw new Error('Unauthorized');
        }
        return getAuditLogsByClient(input.clientId, input.limit, input.offset);
      }),
  }),
});

export type AppRouter = typeof appRouter;
