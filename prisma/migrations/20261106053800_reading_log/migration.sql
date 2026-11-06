-- DropForeignKey
ALTER TABLE "Expense" DROP CONSTRAINT "Expense_userId_fkey";

-- DropTable
DROP TABLE "Expense";

-- CreateTable
CREATE TABLE "ReadingLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bookTitle" TEXT NOT NULL,
    "minutesRead" INTEGER NOT NULL,
    "genre" TEXT NOT NULL,
    "note" TEXT DEFAULT '',
    "favorite" BOOLEAN NOT NULL DEFAULT false,
    "readOn" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReadingLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReadingLog_userId_idx" ON "ReadingLog"("userId");

-- CreateIndex
CREATE INDEX "ReadingLog_userId_readOn_idx" ON "ReadingLog"("userId", "readOn");

-- AddForeignKey
ALTER TABLE "ReadingLog" ADD CONSTRAINT "ReadingLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

