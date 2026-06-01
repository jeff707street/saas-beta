CREATE TABLE IF NOT EXISTS "CompanyInvitation" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'operator',
  "status" TEXT NOT NULL DEFAULT 'pending',
  "clerkInvitationId" TEXT,
  "invitedByUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CompanyInvitation_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CompanyInvitation_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "CompanyInvitation_companyId_email_key" ON "CompanyInvitation"("companyId", "email");
CREATE INDEX IF NOT EXISTS "CompanyInvitation_email_idx" ON "CompanyInvitation"("email");
CREATE INDEX IF NOT EXISTS "CompanyInvitation_companyId_idx" ON "CompanyInvitation"("companyId");

ALTER TABLE "CompanyMembership" ALTER COLUMN "role" SET DEFAULT 'operator';
