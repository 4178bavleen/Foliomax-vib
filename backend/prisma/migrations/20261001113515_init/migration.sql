-- AlterTable
ALTER TABLE `excelfile` ADD COLUMN `driveFileId` VARCHAR(191) NULL,
    ADD COLUMN `driveMimeType` VARCHAR(191) NULL,
    ADD COLUMN `driveUrl` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `ExcelFile_driveFileId_idx` ON `excelfile`(`driveFileId`);
