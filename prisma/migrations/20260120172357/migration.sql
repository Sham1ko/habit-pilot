/*
  Warnings:

  - The primary key for the `habits` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `habits` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `users` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `users` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `user_id` on the `capacity_plans` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `habit_id` on the `habit_entries` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `user_id` on the `habits` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `habit_id` on the `planned_occurrences` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `user_id` on the `share_links` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "capacity_plans" DROP CONSTRAINT "capacity_plans_user_id_fkey";

-- DropForeignKey
ALTER TABLE "habit_entries" DROP CONSTRAINT "habit_entries_habit_id_fkey";

-- DropForeignKey
ALTER TABLE "habits" DROP CONSTRAINT "habits_user_id_fkey";

-- DropForeignKey
ALTER TABLE "planned_occurrences" DROP CONSTRAINT "planned_occurrences_habit_id_fkey";

-- DropForeignKey
ALTER TABLE "share_links" DROP CONSTRAINT "share_links_user_id_fkey";

-- AlterTable
ALTER TABLE "capacity_plans" DROP COLUMN "user_id",
ADD COLUMN     "user_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "habit_entries" DROP COLUMN "habit_id",
ADD COLUMN     "habit_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "habits" DROP CONSTRAINT "habits_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "user_id",
ADD COLUMN     "user_id" INTEGER NOT NULL,
ADD CONSTRAINT "habits_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "planned_occurrences" DROP COLUMN "habit_id",
ADD COLUMN     "habit_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "share_links" DROP COLUMN "user_id",
ADD COLUMN     "user_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "users" DROP CONSTRAINT "users_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");

-- AddForeignKey
ALTER TABLE "habits" ADD CONSTRAINT "habits_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "habit_entries" ADD CONSTRAINT "habit_entries_habit_id_fkey" FOREIGN KEY ("habit_id") REFERENCES "habits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planned_occurrences" ADD CONSTRAINT "planned_occurrences_habit_id_fkey" FOREIGN KEY ("habit_id") REFERENCES "habits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "capacity_plans" ADD CONSTRAINT "capacity_plans_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "share_links" ADD CONSTRAINT "share_links_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
