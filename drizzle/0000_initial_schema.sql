CREATE TABLE `contributions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`snapshot_id` integer NOT NULL,
	`amount` real NOT NULL,
	`type` text NOT NULL,
	FOREIGN KEY (`snapshot_id`) REFERENCES `snapshots`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `funds` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`pension_id` integer NOT NULL,
	`name` text NOT NULL,
	`ticker_isin` text,
	`target_allocation` real,
	FOREIGN KEY (`pension_id`) REFERENCES `pensions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `pensions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`provider` text NOT NULL,
	`name` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `snapshot_entries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`snapshot_id` integer NOT NULL,
	`fund_id` integer NOT NULL,
	`shares_held` real NOT NULL,
	`value` real NOT NULL,
	FOREIGN KEY (`snapshot_id`) REFERENCES `snapshots`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`fund_id`) REFERENCES `funds`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `snapshots` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`pension_id` integer NOT NULL,
	`date` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`pension_id`) REFERENCES `pensions`(`id`) ON UPDATE no action ON DELETE cascade
);
