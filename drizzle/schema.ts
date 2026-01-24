import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json, longtext, boolean, index } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Clients/Organizations table - represents healthcare organizations (clinics, hospitals, labs)
 */
export const clients = mysqlTable("clients", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  apiKey: varchar("apiKey", { length: 255 }).notNull().unique(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [index("idx_apiKey").on(table.apiKey)]);

export type Client = typeof clients.$inferSelect;
export type InsertClient = typeof clients.$inferInsert;

/**
 * Data Mappings table - stores de-para configurations between proprietary and FHIR formats
 */
export const dataMappings = mysqlTable("dataMappings", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  sourceFormat: varchar("sourceFormat", { length: 50 }).notNull(), // e.g., "proprietary_clinic_v1"
  targetFormat: varchar("targetFormat", { length: 50 }).notNull(), // e.g., "fhir_r4_patient"
  mappingRules: longtext("mappingRules").notNull(), // JSON with field mappings
  isActive: boolean("isActive").default(true).notNull(),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [index("idx_clientId").on(table.clientId)]);

export type DataMapping = typeof dataMappings.$inferSelect;
export type InsertDataMapping = typeof dataMappings.$inferInsert;

/**
 * Integration Messages table - stores all incoming and processed messages
 */
export const integrationMessages = mysqlTable("integrationMessages", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  mappingId: int("mappingId").notNull(),
  messageId: varchar("messageId", { length: 255 }).notNull().unique(),
  sourceData: longtext("sourceData").notNull(), // Original encrypted data
  fhirData: longtext("fhirData"), // Transformed FHIR data
  status: mysqlEnum("status", ["received", "processing", "validated", "transformed", "failed", "queued"]).default("received").notNull(),
  validationErrors: longtext("validationErrors"), // JSON array of validation errors
  processedAt: timestamp("processedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [index("idx_clientId").on(table.clientId), index("idx_messageId").on(table.messageId), index("idx_status").on(table.status)]);

export type IntegrationMessage = typeof integrationMessages.$inferSelect;
export type InsertIntegrationMessage = typeof integrationMessages.$inferInsert;

/**
 * Audit Logs table - LGPD-compliant audit trail
 */
export const auditLogs = mysqlTable("auditLogs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  clientId: int("clientId"),
  action: varchar("action", { length: 100 }).notNull(), // e.g., "message_received", "mapping_updated", "data_accessed"
  resourceType: varchar("resourceType", { length: 50 }).notNull(), // e.g., "message", "mapping", "client"
  resourceId: varchar("resourceId", { length: 255 }).notNull(),
  description: text("description"),
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  changes: longtext("changes"), // JSON with before/after values
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [index("idx_userId").on(table.userId), index("idx_clientId").on(table.clientId), index("idx_createdAt").on(table.createdAt)]);

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

/**
 * Alerts table - stores validation and processing errors
 */
export const alerts = mysqlTable("alerts", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  messageId: varchar("messageId", { length: 255 }),
  alertType: mysqlEnum("alertType", ["validation_error", "processing_error", "security_alert", "performance_warning"]).notNull(),
  severity: mysqlEnum("severity", ["low", "medium", "high", "critical"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  details: longtext("details"), // JSON with error details
  isResolved: boolean("isResolved").default(false).notNull(),
  resolvedAt: timestamp("resolvedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [index("idx_clientId").on(table.clientId), index("idx_isResolved").on(table.isResolved)]);

export type Alert = typeof alerts.$inferSelect;
export type InsertAlert = typeof alerts.$inferInsert;

/**
 * Integration Stats table - aggregated statistics for dashboard
 */
export const integrationStats = mysqlTable("integrationStats", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD
  messagesReceived: int("messagesReceived").default(0).notNull(),
  messagesProcessed: int("messagesProcessed").default(0).notNull(),
  messagesFailed: int("messagesFailed").default(0).notNull(),
  averageProcessingTime: int("averageProcessingTime").default(0).notNull(), // in milliseconds
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [index("idx_clientId_date").on(table.clientId, table.date)]);

export type IntegrationStat = typeof integrationStats.$inferSelect;
export type InsertIntegrationStat = typeof integrationStats.$inferInsert;