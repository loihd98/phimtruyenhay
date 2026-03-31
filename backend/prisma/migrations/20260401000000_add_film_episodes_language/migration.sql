-- CreateEnum
CREATE TYPE "FilmLanguage" AS ENUM ('VIETSUB', 'THUYET_MINH', 'LONG_TIENG', 'RAW');

-- AlterTable
ALTER TABLE "film_reviews" ADD COLUMN "language" "FilmLanguage" NOT NULL DEFAULT 'VIETSUB';
ALTER TABLE "film_reviews" ADD COLUMN "totalEpisodes" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "film_reviews" ADD COLUMN "isMovie" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "film_episodes" (
    "id" TEXT NOT NULL,
    "episodeNum" INTEGER NOT NULL,
    "title" TEXT,
    "videoUrl" TEXT NOT NULL,
    "duration" INTEGER,
    "language" "FilmLanguage" NOT NULL DEFAULT 'VIETSUB',
    "filmReviewId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "film_episodes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "film_episodes_filmReviewId_episodeNum_key" ON "film_episodes"("filmReviewId", "episodeNum");

-- AddForeignKey
ALTER TABLE "film_episodes" ADD CONSTRAINT "film_episodes_filmReviewId_fkey" FOREIGN KEY ("filmReviewId") REFERENCES "film_reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;
