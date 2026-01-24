import { eq, and, gte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users, 
  clients, InsertClient,
  dataMappings, InsertDataMapping,
  integrationMessages, InsertIntegrationMessage, IntegrationMessage,
  auditLogs, InsertAuditLog,
  alerts, InsertAlert, Alert,
  integrationStats, InsertIntegrationStat, IntegrationStat
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============ CLIENT QUERIES ============
export async function getClientByApiKey(apiKey: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(clients).where(eq(clients.apiKey, apiKey)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getClientById(clientId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(clients).where(eq(clients.id, clientId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createClient(client: InsertClient) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(clients).values(client);
  return result;
}

// ============ DATA MAPPING QUERIES ============
export async function getDataMappingsByClient(clientId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(dataMappings).where(eq(dataMappings.clientId, clientId));
}

export async function getDataMappingById(mappingId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(dataMappings).where(eq(dataMappings.id, mappingId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createDataMapping(mapping: InsertDataMapping) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(dataMappings).values(mapping);
  return result;
}

// ============ INTEGRATION MESSAGE QUERIES ============
export async function createIntegrationMessage(message: InsertIntegrationMessage) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(integrationMessages).values(message);
  return result;
}

export async function getIntegrationMessageById(messageId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(integrationMessages).where(eq(integrationMessages.messageId, messageId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateIntegrationMessage(messageId: string, updates: Partial<IntegrationMessage>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(integrationMessages).set(updates).where(eq(integrationMessages.messageId, messageId));
}

export async function getMessagesByClient(clientId: number, limit: number = 100, offset: number = 0) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(integrationMessages).where(eq(integrationMessages.clientId, clientId)).limit(limit).offset(offset);
}

// ============ AUDIT LOG QUERIES ============
export async function createAuditLog(log: InsertAuditLog) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(auditLogs).values(log);
  return result;
}

export async function getAuditLogsByClient(clientId: number, limit: number = 100, offset: number = 0) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(auditLogs).where(eq(auditLogs.clientId, clientId)).limit(limit).offset(offset);
}

// ============ ALERT QUERIES ============
export async function createAlert(alert: InsertAlert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(alerts).values(alert);
  return result;
}

export async function getAlertsByClient(clientId: number, unresolved: boolean = true) {
  const db = await getDb();
  if (!db) return [];
  if (unresolved) {
    return db.select().from(alerts).where(and(eq(alerts.clientId, clientId), eq(alerts.isResolved, false)));
  }
  return db.select().from(alerts).where(eq(alerts.clientId, clientId));
}

export async function updateAlert(alertId: number, updates: Partial<Alert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(alerts).set(updates).where(eq(alerts.id, alertId));
}

// ============ INTEGRATION STATS QUERIES ============
export async function getOrCreateDailyStats(clientId: number, date: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const existing = await db.select().from(integrationStats)
    .where(and(eq(integrationStats.clientId, clientId), eq(integrationStats.date, date)))
    .limit(1);
  
  if (existing.length > 0) {
    return existing[0];
  }
  
  await db.insert(integrationStats).values({
    clientId,
    date,
    messagesReceived: 0,
    messagesProcessed: 0,
    messagesFailed: 0,
    averageProcessingTime: 0,
  });
  
  const newStats = await db.select().from(integrationStats)
    .where(and(eq(integrationStats.clientId, clientId), eq(integrationStats.date, date)))
    .limit(1);
  
  if (newStats.length > 0) {
    return newStats[0];
  }
  
  return {
    id: 0,
    clientId,
    date,
    messagesReceived: 0,
    messagesProcessed: 0,
    messagesFailed: 0,
    averageProcessingTime: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export async function updateDailyStats(clientId: number, date: string, updates: Partial<IntegrationStat>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(integrationStats)
    .set(updates)
    .where(and(eq(integrationStats.clientId, clientId), eq(integrationStats.date, date)));
}

export async function getClientStats(clientId: number, days: number = 30) {
  const db = await getDb();
  if (!db) return [];
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const dateStr = startDate.toISOString().split('T')[0];
  
  return db.select().from(integrationStats)
    .where(and(eq(integrationStats.clientId, clientId), gte(integrationStats.date, dateStr)));
}
