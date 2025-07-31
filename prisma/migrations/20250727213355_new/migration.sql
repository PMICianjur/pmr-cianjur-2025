-- DropForeignKey
ALTER TABLE `registration` DROP FOREIGN KEY `Registration_schoolId_fkey`;

-- AddForeignKey
ALTER TABLE `Registration` ADD CONSTRAINT `Registration_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `School`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
