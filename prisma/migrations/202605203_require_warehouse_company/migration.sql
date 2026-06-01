INSERT INTO "Company" ("id", "name", "createdAt", "updatedAt")
SELECT 'company-legacy-default', 'Legacy Workspace', NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM "Company" WHERE "id" = 'company-legacy-default'
);

UPDATE "Warehouse"
SET "companyId" = 'company-legacy-default'
WHERE "companyId" IS NULL;

ALTER TABLE "Warehouse" ALTER COLUMN "companyId" SET NOT NULL;

DROP INDEX IF EXISTS "Warehouse_companyId_name_key";
CREATE UNIQUE INDEX "Warehouse_companyId_name_key" ON "Warehouse"("companyId", "name");
