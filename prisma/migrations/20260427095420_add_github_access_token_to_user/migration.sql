/*
  Warnings:

  - You are about to drop the column `githubAccesToken` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "githubAccesToken",
ADD COLUMN     "githubAccessToken" TEXT;
