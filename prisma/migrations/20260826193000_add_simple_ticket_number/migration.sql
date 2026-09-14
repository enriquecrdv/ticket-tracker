ALTER TABLE `Ticket` ADD COLUMN `number` INTEGER NULL;

SET @ticket_number := 0;
UPDATE `Ticket`
SET `number` = (@ticket_number := @ticket_number + 1)
ORDER BY `createdAt`, `id`;

ALTER TABLE `Ticket`
  MODIFY `number` INTEGER NOT NULL AUTO_INCREMENT,
  ADD UNIQUE INDEX `Ticket_number_key`(`number`);
