// Script único: importa os data/*.json existentes para o SQLite recém
// criado. Roda uma vez, manualmente (npm run db:seed). Idempotente por
// tabela — se já tiver linhas, pula e avisa em vez de duplicar.
import "dotenv/config";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { prisma } from "../lib/prisma";
import type {
  Trip,
  Banner,
  GalleryItem,
  Testimonial,
  Reservation,
  Customer,
  ManualBooking,
  Expense,
} from "../lib/types";

const DATA_DIR = path.join(process.cwd(), "data");

function readJson<T>(file: string): T | null {
  const full = path.join(DATA_DIR, file);
  if (!existsSync(full)) return null;
  return JSON.parse(readFileSync(full, "utf-8")) as T;
}

async function seed<T>(
  label: string,
  file: string,
  count: () => Promise<number>,
  createMany: (rows: unknown[]) => Promise<unknown>,
  toRow: (item: T) => unknown
) {
  const items = readJson<T[]>(file);
  if (!items) {
    console.log(`- ${label}: ${file} não encontrado, pulando.`);
    return;
  }
  const existing = await count();
  if (existing > 0) {
    console.log(`- ${label}: tabela já tem ${existing} linha(s), pulando.`);
    return;
  }
  if (items.length === 0) {
    console.log(`- ${label}: ${file} vazio, nada a importar.`);
    return;
  }
  await createMany(items.map(toRow));
  console.log(`- ${label}: ${items.length} linha(s) importada(s) de ${file}.`);
}

async function main() {
  console.log("Importando data/*.json para o SQLite...\n");

  await seed<Trip>(
    "trips",
    "trips.json",
    () => prisma.trip.count(),
    (rows) => prisma.trip.createMany({ data: rows as never[] }),
    (t) => ({
      id: t.id,
      slug: t.slug,
      title: t.title,
      destination: t.destination,
      date: t.date,
      duration: t.duration,
      price: t.price,
      installments: t.installments,
      spotsTotal: t.spotsTotal,
      spotsLeft: t.spotsLeft,
      shortDescription: t.shortDescription,
      description: t.description,
      coverImage: t.coverImage,
      galleryJson: JSON.stringify(t.gallery),
      hotelJson: t.hotel ? JSON.stringify(t.hotel) : null,
      includedJson: JSON.stringify(t.included),
      notIncludedJson: JSON.stringify(t.notIncluded),
      mapEmbedUrl: t.mapEmbedUrl ?? null,
      itineraryJson: JSON.stringify(t.itinerary),
      faqJson: JSON.stringify(t.faq),
      featured: t.featured,
      busModel: t.busModel ?? null,
      busCount: t.busCount ?? null,
      blockedSeatsJson: t.blockedSeats ? JSON.stringify(t.blockedSeats) : null,
    })
  );

  await seed<Banner>(
    "banners",
    "banners.json",
    () => prisma.banner.count(),
    (rows) => prisma.banner.createMany({ data: rows as never[] }),
    (b) => ({
      id: b.id,
      title: b.title,
      subtitle: b.subtitle,
      price: b.price ?? null,
      image: b.image,
      tripSlug: b.tripSlug ?? null,
      order: b.order,
    })
  );

  await seed<GalleryItem>(
    "gallery",
    "gallery.json",
    () => prisma.galleryItem.count(),
    (rows) => prisma.galleryItem.createMany({ data: rows as never[] }),
    (g) => ({
      id: g.id,
      image: g.image,
      caption: g.caption ?? null,
      tripSlug: g.tripSlug ?? null,
      cover: g.cover ?? false,
    })
  );

  await seed<Testimonial>(
    "testimonials",
    "testimonials.json",
    () => prisma.testimonial.count(),
    (rows) => prisma.testimonial.createMany({ data: rows as never[] }),
    (t) => ({
      id: t.id,
      name: t.name,
      avatar: t.avatar,
      rating: t.rating,
      text: t.text,
      trip: t.trip ?? null,
    })
  );

  await seed<Reservation>(
    "reservations",
    "reservations.json",
    () => prisma.reservation.count(),
    (rows) => prisma.reservation.createMany({ data: rows as never[] }),
    (r) => ({
      id: r.id,
      tripId: r.tripId,
      tripSlug: r.tripSlug,
      tripTitle: r.tripTitle,
      tripDate: r.tripDate,
      name: r.name,
      email: r.email,
      phone: r.phone,
      passengers: r.passengers,
      seatsJson: r.seats ? JSON.stringify(r.seats) : null,
      passengerDetailsJson: r.passengerDetails
        ? JSON.stringify(r.passengerDetails)
        : null,
      amount: r.amount,
      transactionId: r.transactionId ?? null,
      checkoutSlug: r.checkoutSlug ?? null,
      paymentMethod: r.paymentMethod ?? null,
      status: r.status,
      spotsCounted: r.spotsCounted,
      createdAt: r.createdAt,
    })
  );

  await seed<Customer>(
    "customers",
    "customers.json",
    () => prisma.customer.count(),
    (rows) => prisma.customer.createMany({ data: rows as never[] }),
    (c) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone ?? null,
      googleId: c.googleId ?? null,
      picture: c.picture ?? null,
      sessionToken: c.sessionToken ?? null,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    })
  );

  await seed<ManualBooking>(
    "manual-bookings",
    "manual-bookings.json",
    () => prisma.manualBooking.count(),
    (rows) => prisma.manualBooking.createMany({ data: rows as never[] }),
    (b) => ({
      id: b.id,
      tripId: b.tripId,
      buyerName: b.buyerName,
      phone: b.phone ?? null,
      seatsJson: JSON.stringify(b.seats),
      passengerDetailsJson: JSON.stringify(b.passengerDetails),
      amount: b.amount,
      paymentMethod: b.paymentMethod,
      boardingPoint: b.boardingPoint ?? null,
      notes: b.notes ?? null,
      status: b.status,
      createdAt: b.createdAt,
      updatedAt: b.updatedAt,
      buyerDocument: b.buyerDocument ?? null,
      buyerBirthDate: b.buyerBirthDate ?? null,
      buyerAddress: b.buyerAddress ?? null,
      buyerCep: b.buyerCep ?? null,
      installmentsJson: b.installments ? JSON.stringify(b.installments) : null,
    })
  );

  await seed<Expense>(
    "expenses",
    "expenses.json",
    () => prisma.expense.count(),
    (rows) => prisma.expense.createMany({ data: rows as never[] }),
    (e) => ({
      id: e.id,
      tripId: e.tripId,
      description: e.description,
      category: e.category,
      amount: e.amount,
      date: e.date ?? null,
      notes: e.notes ?? null,
      createdAt: e.createdAt,
      updatedAt: e.updatedAt,
    })
  );

  console.log("\nContagem final por tabela:");
  console.log("  trips:", await prisma.trip.count());
  console.log("  banners:", await prisma.banner.count());
  console.log("  gallery:", await prisma.galleryItem.count());
  console.log("  testimonials:", await prisma.testimonial.count());
  console.log("  reservations:", await prisma.reservation.count());
  console.log("  customers:", await prisma.customer.count());
  console.log("  manual-bookings:", await prisma.manualBooking.count());
  console.log("  expenses:", await prisma.expense.count());

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
