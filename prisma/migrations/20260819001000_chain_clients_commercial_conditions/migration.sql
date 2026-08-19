ALTER TABLE `User` ADD COLUMN `chainId` VARCHAR(191) NULL;
ALTER TABLE `Client` ADD COLUMN `chainId` VARCHAR(191) NULL;

CREATE INDEX `User_chainId_idx` ON `User`(`chainId`);
CREATE INDEX `Client_chainId_customerNumber_idx` ON `Client`(`chainId`, `customerNumber`);

CREATE TABLE `CommercialCondition` (
  `id` VARCHAR(191) NOT NULL,
  `chainId` VARCHAR(191) NOT NULL,
  `credit` VARCHAR(100) NULL,
  `contract` VARCHAR(100) NULL,
  `guarantee` VARCHAR(100) NULL,
  `collection` VARCHAR(100) NULL,
  `collectionPortal` VARCHAR(100) NULL,
  `segment` VARCHAR(50) NULL,
  `priceList` VARCHAR(50) NULL,
  `discount` VARCHAR(100) NULL,
  `promoList` VARCHAR(100) NULL,
  `continent` VARCHAR(50) NULL,
  `scheme` VARCHAR(50) NULL,
  `creditDays` VARCHAR(50) NULL,
  `pinc` VARCHAR(100) NULL,
  `cashAndCredit` VARCHAR(100) NULL,
  `comments` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `CommercialCondition_chainId_key`(`chainId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `User` ADD CONSTRAINT `User_chainId_fkey` FOREIGN KEY (`chainId`) REFERENCES `Chain`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `Client` ADD CONSTRAINT `Client_chainId_fkey` FOREIGN KEY (`chainId`) REFERENCES `Chain`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `CommercialCondition` ADD CONSTRAINT `CommercialCondition_chainId_fkey` FOREIGN KEY (`chainId`) REFERENCES `Chain`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
