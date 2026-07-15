-- CreateTable
CREATE TABLE "Trip" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "duration" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "installments" TEXT NOT NULL,
    "spotsTotal" INTEGER NOT NULL,
    "spotsLeft" INTEGER NOT NULL,
    "shortDescription" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "coverImage" TEXT NOT NULL,
    "galleryJson" TEXT NOT NULL,
    "hotelJson" TEXT,
    "includedJson" TEXT NOT NULL,
    "notIncludedJson" TEXT NOT NULL,
    "mapEmbedUrl" TEXT,
    "itineraryJson" TEXT NOT NULL,
    "faqJson" TEXT NOT NULL,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "busModel" TEXT,
    "busCount" INTEGER,
    "blockedSeatsJson" TEXT
);

-- CreateTable
CREATE TABLE "Banner" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "subtitle" TEXT NOT NULL,
    "price" TEXT,
    "image" TEXT NOT NULL,
    "tripSlug" TEXT,
    "order" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "GalleryItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "image" TEXT NOT NULL,
    "caption" TEXT,
    "tripSlug" TEXT,
    "cover" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "Testimonial" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "avatar" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "trip" TEXT
);

-- CreateTable
CREATE TABLE "Reservation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tripId" TEXT NOT NULL,
    "tripSlug" TEXT NOT NULL,
    "tripTitle" TEXT NOT NULL,
    "tripDate" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "passengers" INTEGER NOT NULL,
    "seatsJson" TEXT,
    "passengerDetailsJson" TEXT,
    "amount" REAL NOT NULL,
    "transactionId" TEXT,
    "checkoutSlug" TEXT,
    "paymentMethod" TEXT,
    "status" TEXT NOT NULL,
    "spotsCounted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "googleId" TEXT,
    "picture" TEXT,
    "sessionToken" TEXT,
    "createdAt" TEXT NOT NULL,
    "updatedAt" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "ManualBooking" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tripId" TEXT NOT NULL,
    "buyerName" TEXT NOT NULL,
    "phone" TEXT,
    "seatsJson" TEXT NOT NULL,
    "passengerDetailsJson" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "boardingPoint" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL,
    "createdAt" TEXT NOT NULL,
    "updatedAt" TEXT NOT NULL,
    "buyerDocument" TEXT,
    "buyerBirthDate" TEXT,
    "buyerAddress" TEXT,
    "buyerCep" TEXT,
    "installmentsJson" TEXT
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tripId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "date" TEXT,
    "notes" TEXT,
    "createdAt" TEXT NOT NULL,
    "updatedAt" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Trip_slug_key" ON "Trip"("slug");
