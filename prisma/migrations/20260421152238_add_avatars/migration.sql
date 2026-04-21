/*
  Warnings:

  - You are about to drop the column `profile_picture_url` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "users" DROP COLUMN "profile_picture_url",
ADD COLUMN     "avatar_id" UUID;

-- CreateTable
CREATE TABLE "avatars" (
    "id" UUID NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "image_url" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "avatars_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_avatar_id_fkey" FOREIGN KEY ("avatar_id") REFERENCES "avatars"("id") ON DELETE SET NULL ON UPDATE CASCADE;
