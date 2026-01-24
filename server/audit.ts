import { createAuditLog } from './db';
import { InsertAuditLog } from '../drizzle/schema';
import type { Request } from 'express';

/**
 * Audit logging module for LGPD compliance
 * Tracks all access and modifications to healthcare data
 */

/**
 * Extracts client IP address from request
 */
function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress || 'unknown';
}

/**
 * Logs an action for audit trail
 */
export async function logAuditAction(
  req: Request,
  userId: number | undefined,
  clientId: number | undefined,
  action: string,
  resourceType: string,
  resourceId: string,
  description?: string,
  changes?: Record<string, unknown>
): Promise<void> {
  try {
    const auditLog: InsertAuditLog = {
      userId: userId || null,
      clientId: clientId || null,
      action,
      resourceType,
      resourceId,
      description: description || null,
      ipAddress: getClientIp(req),
      userAgent: req.headers['user-agent'] || null,
      changes: changes ? JSON.stringify(changes) : null,
    };

    await createAuditLog(auditLog);
  } catch (error) {
    console.error('[Audit] Failed to log action:', error);
    // Don't throw - audit failures shouldn't break the main operation
  }
}

/**
 * Logs a data access event
 */
export async function logDataAccess(
  req: Request,
  userId: number | undefined,
  clientId: number | undefined,
  dataType: string,
  dataId: string,
  purpose?: string
): Promise<void> {
  await logAuditAction(
    req,
    userId,
    clientId,
    'data_accessed',
    dataType,
    dataId,
    purpose || 'Data accessed'
  );
}

/**
 * Logs a message processing event
 */
export async function logMessageProcessing(
  req: Request,
  clientId: number,
  messageId: string,
  status: string,
  details?: Record<string, unknown>
): Promise<void> {
  await logAuditAction(
    req,
    undefined,
    clientId,
    'message_processed',
    'integration_message',
    messageId,
    `Message processing: ${status}`,
    details
  );
}

/**
 * Logs a configuration change
 */
export async function logConfigChange(
  req: Request,
  userId: number,
  clientId: number,
  resourceType: string,
  resourceId: string,
  before: Record<string, unknown>,
  after: Record<string, unknown>
): Promise<void> {
  await logAuditAction(
    req,
    userId,
    clientId,
    'config_updated',
    resourceType,
    resourceId,
    `Configuration updated`,
    { before, after }
  );
}

/**
 * Logs a security event
 */
export async function logSecurityEvent(
  req: Request,
  clientId: number | undefined,
  eventType: string,
  description: string,
  details?: Record<string, unknown>
): Promise<void> {
  await logAuditAction(
    req,
    undefined,
    clientId || undefined,
    eventType,
    'security_event',
    `security_${Date.now()}`,
    description,
    details
  );
}
