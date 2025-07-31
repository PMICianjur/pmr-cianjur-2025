-- CreateTable
CREATE TABLE `TemporaryRegistration` (
    `id` VARCHAR(191) NOT NULL,
    `step` INTEGER NOT NULL DEFAULT 1,
    `data` JSON NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `School` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `normalizedName` VARCHAR(191) NOT NULL,
    `coachName` VARCHAR(191) NOT NULL,
    `whatsappNumber` VARCHAR(191) NOT NULL,
    `category` ENUM('WIRA', 'MADYA') NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `School_name_key`(`name`),
    UNIQUE INDEX `School_normalizedName_key`(`normalizedName`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Participant` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fullName` VARCHAR(191) NOT NULL,
    `birthPlaceDate` VARCHAR(191) NOT NULL,
    `address` VARCHAR(191) NOT NULL,
    `religion` VARCHAR(191) NOT NULL,
    `bloodType` VARCHAR(191) NULL,
    `entryYear` INTEGER NOT NULL,
    `phoneNumber` VARCHAR(191) NULL,
    `gender` ENUM('LAKI_LAKI', 'PEREMPUAN') NOT NULL,
    `photoFilename` VARCHAR(191) NULL,
    `registrationId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Companion` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fullName` VARCHAR(191) NOT NULL,
    `birthPlaceDate` VARCHAR(191) NOT NULL,
    `address` VARCHAR(191) NOT NULL,
    `religion` VARCHAR(191) NOT NULL,
    `bloodType` VARCHAR(191) NULL,
    `entryYear` INTEGER NOT NULL,
    `phoneNumber` VARCHAR(191) NULL,
    `gender` ENUM('LAKI_LAKI', 'PEREMPUAN') NOT NULL,
    `registrationId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Registration` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `schoolId` INTEGER NOT NULL,
    `tentType` ENUM('BAWA_SENDIRI', 'SEWA_PANITIA') NOT NULL,
    `tentCapacity` INTEGER NULL,
    `kavlingNumber` INTEGER NULL,
    `participantCount` INTEGER NOT NULL,
    `companionCount` INTEGER NOT NULL,
    `baseFee` DOUBLE NOT NULL,
    `tentFee` DOUBLE NOT NULL,
    `totalFee` DOUBLE NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Registration_schoolId_key`(`schoolId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Payment` (
    `id` VARCHAR(191) NOT NULL,
    `registrationId` INTEGER NOT NULL,
    `method` ENUM('MANUAL', 'MIDTRANS') NOT NULL,
    `status` ENUM('PENDING', 'SUCCESS', 'FAILED', 'EXPIRED', 'WAITING_CONFIRMATION') NOT NULL DEFAULT 'PENDING',
    `amount` DOUBLE NOT NULL,
    `midtransToken` TEXT NULL,
    `midtransResponse` JSON NULL,
    `manualProofPath` VARCHAR(191) NULL,
    `confirmedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Payment_registrationId_key`(`registrationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `KavlingBooking` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `kavlingNumber` INTEGER NOT NULL,
    `capacity` INTEGER NOT NULL,
    `category` ENUM('WIRA', 'MADYA') NOT NULL,
    `isBooked` BOOLEAN NOT NULL DEFAULT false,
    `registrationId` INTEGER NULL,

    UNIQUE INDEX `KavlingBooking_registrationId_key`(`registrationId`),
    UNIQUE INDEX `KavlingBooking_kavlingNumber_capacity_category_key`(`kavlingNumber`, `capacity`, `category`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Participant` ADD CONSTRAINT `Participant_registrationId_fkey` FOREIGN KEY (`registrationId`) REFERENCES `Registration`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Companion` ADD CONSTRAINT `Companion_registrationId_fkey` FOREIGN KEY (`registrationId`) REFERENCES `Registration`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Registration` ADD CONSTRAINT `Registration_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `School`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Payment` ADD CONSTRAINT `Payment_registrationId_fkey` FOREIGN KEY (`registrationId`) REFERENCES `Registration`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `KavlingBooking` ADD CONSTRAINT `KavlingBooking_registrationId_fkey` FOREIGN KEY (`registrationId`) REFERENCES `Registration`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
