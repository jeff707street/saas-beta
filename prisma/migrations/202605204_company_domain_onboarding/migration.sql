ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "onboardingStatus" TEXT NOT NULL DEFAULT 'pending';

CREATE TABLE IF NOT EXISTS "CompanyDomain" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "domain" TEXT NOT NULL,
  "clerkOrganizationId" TEXT,
  "clerkOrganizationDomainId" TEXT,
  "verifiedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "CompanyDomain_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CompanyDomain_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "CompanyJoinRequest" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "domain" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "message" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "CompanyJoinRequest_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CompanyJoinRequest_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "CompanyJoinRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "CompanyDomain_companyId_domain_key" ON "CompanyDomain"("companyId", "domain");
CREATE INDEX IF NOT EXISTS "CompanyDomain_domain_idx" ON "CompanyDomain"("domain");
CREATE INDEX IF NOT EXISTS "CompanyDomain_companyId_idx" ON "CompanyDomain"("companyId");
CREATE UNIQUE INDEX IF NOT EXISTS "CompanyJoinRequest_companyId_userId_key" ON "CompanyJoinRequest"("companyId", "userId");
CREATE INDEX IF NOT EXISTS "CompanyJoinRequest_domain_idx" ON "CompanyJoinRequest"("domain");
