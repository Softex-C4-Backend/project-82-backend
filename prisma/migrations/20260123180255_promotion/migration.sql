/*
  Warnings:

  - Changed the type of `discountType` on the `promotion` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('PERCENTAGE', 'FIXED_VALUE');

-- AlterTable
ALTER TABLE "promotion" DROP COLUMN "discountType",
ADD COLUMN     "discountType" "DiscountType" NOT NULL;
