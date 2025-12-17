/*
  Warnings:

  - You are about to drop the column `barcode` on the `Product` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[code]` on the table `Product` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `code` to the `Product` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Product_barcode_key";

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "barcode",
ADD COLUMN     "code" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Product_code_key" ON "Product"("code");
