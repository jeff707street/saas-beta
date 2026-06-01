CREATE TABLE IF NOT EXISTS "SpotProductAssignment" (
  "id" TEXT NOT NULL,
  "palletSpotId" TEXT NOT NULL,
  "skuId" TEXT NOT NULL,
  "level" INTEGER NOT NULL,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SpotProductAssignment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "SpotProductAssignment_palletSpotId_fkey" FOREIGN KEY ("palletSpotId") REFERENCES "PalletSpot"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "SpotProductAssignment_skuId_fkey" FOREIGN KEY ("skuId") REFERENCES "SKU"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "SpotProductAssignment_palletSpotId_skuId_level_key" ON "SpotProductAssignment"("palletSpotId", "skuId", "level");
CREATE INDEX IF NOT EXISTS "SpotProductAssignment_palletSpotId_idx" ON "SpotProductAssignment"("palletSpotId");
CREATE INDEX IF NOT EXISTS "SpotProductAssignment_skuId_idx" ON "SpotProductAssignment"("skuId");

DROP INDEX IF EXISTS "SKU_code_key";
CREATE INDEX IF NOT EXISTS "SKU_code_idx" ON "SKU"("code");
