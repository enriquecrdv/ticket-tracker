-- CreateTable
CREATE TABLE `_AnalystChains` (
    `A` VARCHAR(191) NOT NULL,
    `B` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `_AnalystChains_AB_unique`(`A`, `B`),
    INDEX `_AnalystChains_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `_AnalystChains` ADD CONSTRAINT `_AnalystChains_A_fkey` FOREIGN KEY (`A`) REFERENCES `Chain`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_AnalystChains` ADD CONSTRAINT `_AnalystChains_B_fkey` FOREIGN KEY (`B`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
