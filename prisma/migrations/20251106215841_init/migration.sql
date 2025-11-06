-- CreateEnum
CREATE TYPE "ShareLinkKind" AS ENUM ('public', 'ics');

-- CreateEnum
CREATE TYPE "HabitEntryStatus" AS ENUM ('done', 'skipped', 'micro_done', 'recovered');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "tz" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "habits" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "weight_cu" DECIMAL NOT NULL,
    "freq_type" TEXT NOT NULL,
    "freq_per_week" DECIMAL NOT NULL,
    "has_micro" BOOLEAN NOT NULL DEFAULT false,
    "context_tags" TEXT[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "habits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "habit_entries" (
    "id" UUID NOT NULL,
    "habit_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "actual_weight_cu" DECIMAL NOT NULL,
    "status" "HabitEntryStatus" NOT NULL,
    "proof_url" TEXT,
    "note" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "habit_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "planned_occurrences" (
    "id" UUID NOT NULL,
    "habit_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "planned_weight_cu" DECIMAL NOT NULL,
    "context_tag" TEXT,

    CONSTRAINT "planned_occurrences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "capacity_plans" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "week_start_date" DATE NOT NULL,
    "capacity_cu" DECIMAL NOT NULL,

    CONSTRAINT "capacity_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "share_links" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "kind" "ShareLinkKind" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "expires_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "share_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "share_links_token_key" ON "share_links"("token");

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
