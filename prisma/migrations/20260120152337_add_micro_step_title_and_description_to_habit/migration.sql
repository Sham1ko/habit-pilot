/*
  Warnings:

  - Added the required column `micro_weight_cu` to the `habits` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "habits" ADD COLUMN     "micro_title" TEXT,
ADD COLUMN     "micro_weight_cu" DECIMAL NOT NULL;
