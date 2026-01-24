CREATE TABLE `alerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`messageId` varchar(255),
	`alertType` enum('validation_error','processing_error','security_alert','performance_warning') NOT NULL,
	`severity` enum('low','medium','high','critical') NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`details` longtext,
	`isResolved` boolean NOT NULL DEFAULT false,
	`resolvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `alerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `auditLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`clientId` int,
	`action` varchar(100) NOT NULL,
	`resourceType` varchar(50) NOT NULL,
	`resourceId` varchar(255) NOT NULL,
	`description` text,
	`ipAddress` varchar(45),
	`userAgent` text,
	`changes` longtext,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `auditLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `clients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`apiKey` varchar(255) NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `clients_id` PRIMARY KEY(`id`),
	CONSTRAINT `clients_apiKey_unique` UNIQUE(`apiKey`)
);
--> statement-breakpoint
CREATE TABLE `dataMappings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`sourceFormat` varchar(50) NOT NULL,
	`targetFormat` varchar(50) NOT NULL,
	`mappingRules` longtext NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dataMappings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `integrationMessages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`mappingId` int NOT NULL,
	`messageId` varchar(255) NOT NULL,
	`sourceData` longtext NOT NULL,
	`fhirData` longtext,
	`status` enum('received','processing','validated','transformed','failed') NOT NULL DEFAULT 'received',
	`validationErrors` longtext,
	`processedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `integrationMessages_id` PRIMARY KEY(`id`),
	CONSTRAINT `integrationMessages_messageId_unique` UNIQUE(`messageId`)
);
--> statement-breakpoint
CREATE TABLE `integrationStats` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`date` varchar(10) NOT NULL,
	`messagesReceived` int NOT NULL DEFAULT 0,
	`messagesProcessed` int NOT NULL DEFAULT 0,
	`messagesFailed` int NOT NULL DEFAULT 0,
	`averageProcessingTime` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `integrationStats_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_clientId` ON `alerts` (`clientId`);--> statement-breakpoint
CREATE INDEX `idx_isResolved` ON `alerts` (`isResolved`);--> statement-breakpoint
CREATE INDEX `idx_userId` ON `auditLogs` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_clientId` ON `auditLogs` (`clientId`);--> statement-breakpoint
CREATE INDEX `idx_createdAt` ON `auditLogs` (`createdAt`);--> statement-breakpoint
CREATE INDEX `idx_apiKey` ON `clients` (`apiKey`);--> statement-breakpoint
CREATE INDEX `idx_clientId` ON `dataMappings` (`clientId`);--> statement-breakpoint
CREATE INDEX `idx_clientId` ON `integrationMessages` (`clientId`);--> statement-breakpoint
CREATE INDEX `idx_messageId` ON `integrationMessages` (`messageId`);--> statement-breakpoint
CREATE INDEX `idx_status` ON `integrationMessages` (`status`);--> statement-breakpoint
CREATE INDEX `idx_clientId_date` ON `integrationStats` (`clientId`,`date`);