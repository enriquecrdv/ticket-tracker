UPDATE `Ticket`
SET `folio` = CAST(99999 + `number` AS CHAR);
