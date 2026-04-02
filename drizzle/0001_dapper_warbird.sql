CREATE TABLE `search_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`appId` varchar(32) NOT NULL,
	`appName` varchar(256) NOT NULL,
	`appIcon` text,
	`developer` varchar(256),
	`sessionId` varchar(64),
	`userId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `search_history_id` PRIMARY KEY(`id`)
);
