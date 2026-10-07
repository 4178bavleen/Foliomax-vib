/*
  Warnings:

  - You are about to drop the column `code` on the `Company` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `Company` table. All the data in the column will be lost.
  - You are about to drop the column `deletedAt` on the `Quiz` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `Quiz` table. All the data in the column will be lost.
  - You are about to drop the column `settings` on the `Quiz` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Quiz` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `Quiz` table. All the data in the column will be lost.
  - You are about to drop the column `companyId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `Answer` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Attempt` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Option` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Question` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `QuizQuestion` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[name]` on the table `Company` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `correctIndex` to the `Quiz` table without a default value. This is not possible if the table is not empty.
  - Added the required column `options` to the `Quiz` table without a default value. This is not possible if the table is not empty.
  - Added the required column `question` to the `Quiz` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `Answer` DROP FOREIGN KEY `Answer_attemptId_fkey`;

-- DropForeignKey
ALTER TABLE `Attempt` DROP FOREIGN KEY `Attempt_quizId_fkey`;

-- DropForeignKey
ALTER TABLE `Attempt` DROP FOREIGN KEY `Attempt_userId_fkey`;

-- DropForeignKey
ALTER TABLE `Option` DROP FOREIGN KEY `Option_questionId_fkey`;

-- DropForeignKey
ALTER TABLE `Question` DROP FOREIGN KEY `Question_companyId_fkey`;

-- DropForeignKey
ALTER TABLE `Quiz` DROP FOREIGN KEY `Quiz_companyId_fkey`;

-- DropForeignKey
ALTER TABLE `QuizQuestion` DROP FOREIGN KEY `QuizQuestion_questionId_fkey`;

-- DropForeignKey
ALTER TABLE `QuizQuestion` DROP FOREIGN KEY `QuizQuestion_quizId_fkey`;

-- DropForeignKey
ALTER TABLE `User` DROP FOREIGN KEY `User_companyId_fkey`;

-- DropIndex
DROP INDEX `Company_code_key` ON `Company`;

-- DropIndex
DROP INDEX `Quiz_companyId_title_key` ON `Quiz`;

-- DropIndex
DROP INDEX `User_companyId_idx` ON `User`;

-- AlterTable
ALTER TABLE `Company` DROP COLUMN `code`,
    DROP COLUMN `isActive`,
    ADD COLUMN `status` ENUM('ACTIVE', 'PENDING', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE `Quiz` DROP COLUMN `deletedAt`,
    DROP COLUMN `description`,
    DROP COLUMN `settings`,
    DROP COLUMN `status`,
    DROP COLUMN `title`,
    ADD COLUMN `correctIndex` INTEGER NOT NULL,
    ADD COLUMN `note` LONGTEXT NULL,
    ADD COLUMN `options` JSON NOT NULL,
    ADD COLUMN `question` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `User` DROP COLUMN `companyId`;

-- DropTable
DROP TABLE `Answer`;

-- DropTable
DROP TABLE `Attempt`;

-- DropTable
DROP TABLE `Option`;

-- DropTable
DROP TABLE `Question`;

-- DropTable
DROP TABLE `QuizQuestion`;

-- CreateIndex
CREATE UNIQUE INDEX `Company_name_key` ON `Company`(`name`);

-- AddForeignKey
ALTER TABLE `Quiz` ADD CONSTRAINT `Quiz_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `Company`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
