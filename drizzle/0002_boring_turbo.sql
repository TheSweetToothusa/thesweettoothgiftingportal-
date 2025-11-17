ALTER TABLE `giftingOrders` MODIFY COLUMN `userId` int;--> statement-breakpoint
ALTER TABLE `giftingOrders` ADD `giftMessageFont` varchar(100) DEFAULT 'Arial';--> statement-breakpoint
ALTER TABLE `giftingOrders` ADD `giftMessageFontSize` varchar(10) DEFAULT '16';--> statement-breakpoint
ALTER TABLE `giftingOrders` ADD `wantsLogoBar` enum('yes','no') DEFAULT 'no';--> statement-breakpoint
ALTER TABLE `giftingOrders` ADD `logoBarSize` enum('small','large') DEFAULT 'small';--> statement-breakpoint
ALTER TABLE `giftingOrders` ADD `logoBarChocolateType` enum('milk','white','dark','vegan_parve') DEFAULT 'white';--> statement-breakpoint
ALTER TABLE `giftingOrders` ADD `completedStep1` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `giftingOrders` ADD `completedStep2` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `giftingOrders` ADD `completedStep3` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `giftingOrders` ADD `completedStep4` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `giftingOrders` ADD `completedStep5` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `recipients` ADD `recipientCompany` varchar(255);--> statement-breakpoint
ALTER TABLE `recipients` ADD `logoBar` enum('none','small','large') DEFAULT 'none';--> statement-breakpoint
ALTER TABLE `recipients` ADD `logoBarChocolateType` enum('milk','white','dark','vegan_parve') DEFAULT 'white';