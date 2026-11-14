-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'MEMBER');

-- CreateEnum
CREATE TYPE "SnackCategory" AS ENUM ('SWEET', 'SAVOURY', 'DRINK', 'HEALTHY_ISH');

-- CreateEnum
CREATE TYPE "ProductRequestStatus" AS ENUM ('REQUESTED', 'APPROVED', 'REJECTED', 'PURCHASED', 'AVAILABLE');

-- CreateEnum
CREATE TYPE "ActivityAction" AS ENUM ('CONSUMED', 'RESTOCKED', 'REQUEST_APPROVED', 'REQUEST_REJECTED', 'REQUEST_PURCHASED', 'REQUEST_AVAILABLE');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "department" TEXT,
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "snacks" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "category" "SnackCategory" NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "imageUrl" TEXT NOT NULL DEFAULT '',
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "lowStockThreshold" INTEGER NOT NULL DEFAULT 5,
    "priceInr" DECIMAL(10,2),
    "arrivalUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "snacks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "votes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "snackId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "votes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_request_groups" (
    "id" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "status" "ProductRequestStatus" NOT NULL DEFAULT 'REQUESTED',
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "decisionNote" TEXT,
    "purchasedAt" TIMESTAMP(3),
    "availableAt" TIMESTAMP(3),
    "actualQuantityAdded" INTEGER,
    "linkedSnackId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_request_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "member_snack_requests" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expectedPriceInr" DECIMAL(10,2),
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "member_snack_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activities" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "action" "ActivityAction" NOT NULL,
    "snackId" TEXT,
    "groupId" TEXT,
    "snackName" TEXT NOT NULL,
    "amount" INTEGER,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_isVerified_idx" ON "users"("role", "isVerified");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_tokenHash_key" ON "sessions"("tokenHash");

-- CreateIndex
CREATE INDEX "sessions_userId_expiresAt_idx" ON "sessions"("userId", "expiresAt");

-- CreateIndex
CREATE INDEX "sessions_expiresAt_idx" ON "sessions"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "snacks_normalizedName_key" ON "snacks"("normalizedName");

-- CreateIndex
CREATE INDEX "snacks_category_quantity_idx" ON "snacks"("category", "quantity");

-- CreateIndex
CREATE INDEX "snacks_createdAt_id_idx" ON "snacks"("createdAt", "id");

-- CreateIndex
CREATE INDEX "snacks_name_idx" ON "snacks" USING GIN ("name" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "snacks_description_idx" ON "snacks" USING GIN ("description" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "votes_snackId_idx" ON "votes"("snackId");

-- CreateIndex
CREATE UNIQUE INDEX "votes_userId_snackId_key" ON "votes"("userId", "snackId");

-- CreateIndex
CREATE UNIQUE INDEX "product_request_groups_normalizedName_key" ON "product_request_groups"("normalizedName");

-- CreateIndex
CREATE UNIQUE INDEX "product_request_groups_linkedSnackId_key" ON "product_request_groups"("linkedSnackId");

-- CreateIndex
CREATE INDEX "product_request_groups_status_updatedAt_id_idx" ON "product_request_groups"("status", "updatedAt", "id");

-- CreateIndex
CREATE INDEX "member_snack_requests_userId_createdAt_id_idx" ON "member_snack_requests"("userId", "createdAt", "id");

-- CreateIndex
CREATE INDEX "member_snack_requests_groupId_createdAt_userId_idx" ON "member_snack_requests"("groupId", "createdAt", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "member_snack_requests_groupId_userId_key" ON "member_snack_requests"("groupId", "userId");

-- CreateIndex
CREATE INDEX "activities_createdAt_id_idx" ON "activities"("createdAt", "id");

-- CreateIndex
CREATE INDEX "activities_action_createdAt_id_idx" ON "activities"("action", "createdAt", "id");

-- CreateIndex
CREATE INDEX "activities_snackId_createdAt_id_idx" ON "activities"("snackId", "createdAt", "id");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votes" ADD CONSTRAINT "votes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votes" ADD CONSTRAINT "votes_snackId_fkey" FOREIGN KEY ("snackId") REFERENCES "snacks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_request_groups" ADD CONSTRAINT "product_request_groups_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_request_groups" ADD CONSTRAINT "product_request_groups_linkedSnackId_fkey" FOREIGN KEY ("linkedSnackId") REFERENCES "snacks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member_snack_requests" ADD CONSTRAINT "member_snack_requests_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "product_request_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member_snack_requests" ADD CONSTRAINT "member_snack_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_snackId_fkey" FOREIGN KEY ("snackId") REFERENCES "snacks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "product_request_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "users"
ADD CONSTRAINT "users_email_normalized_check"
CHECK ("email" = lower(btrim("email")));

ALTER TABLE "snacks"
ADD CONSTRAINT "snacks_quantity_nonnegative_check"
CHECK ("quantity" >= 0),
ADD CONSTRAINT "snacks_threshold_nonnegative_check"
CHECK ("lowStockThreshold" >= 0),
ADD CONSTRAINT "snacks_name_normalized_check"
CHECK ("normalizedName" = lower(btrim("normalizedName")) AND "normalizedName" <> '');

ALTER TABLE "product_request_groups"
ADD CONSTRAINT "product_request_groups_name_normalized_check"
CHECK ("normalizedName" = lower(btrim("normalizedName")) AND "normalizedName" <> ''),
ADD CONSTRAINT "product_request_groups_quantity_positive_check"
CHECK ("actualQuantityAdded" IS NULL OR "actualQuantityAdded" > 0),
ADD CONSTRAINT "product_request_groups_available_complete_check"
CHECK (
    "status" <> 'AVAILABLE'
    OR ("linkedSnackId" IS NOT NULL AND "availableAt" IS NOT NULL AND "actualQuantityAdded" IS NOT NULL)
);

ALTER TABLE "member_snack_requests"
ADD CONSTRAINT "member_snack_requests_price_positive_check"
CHECK ("expectedPriceInr" IS NULL OR "expectedPriceInr" > 0);

ALTER TABLE "activities"
ADD CONSTRAINT "activities_amount_positive_check"
CHECK ("amount" IS NULL OR "amount" > 0);
