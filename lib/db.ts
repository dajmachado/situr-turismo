import { prisma } from "./prisma";
import type {
  Trip,
  Banner,
  GalleryItem,
  Testimonial,
  Reservation,
  Customer,
  ManualBooking,
  Expense,
  PaymentMethod,
  ExpenseCategory,
} from "./types";
import { occupiedSeatsForTrip, tripCapacity } from "./bus";

// ---------------------------------------------------------------------------
// Mapeamento linha (SQLite/Prisma) ↔ tipo do app. Campos aninhados/array são
// guardados como texto JSON em colunas "xxxJson" (ver prisma/schema.prisma) e
// convertidos aqui — evita o tipo Json nativo do Prisma (sem uso real em
// SQLite, já que nunca filtramos por dentro desses campos via SQL).
// ---------------------------------------------------------------------------

function tripFromRow(row: {
  id: string;
  slug: string;
  title: string;
  destination: string;
  date: string;
  duration: string;
  price: number;
  installments: string;
  spotsTotal: number;
  spotsLeft: number;
  shortDescription: string;
  description: string;
  coverImage: string;
  galleryJson: string;
  hotelJson: string | null;
  includedJson: string;
  notIncludedJson: string;
  mapEmbedUrl: string | null;
  itineraryJson: string;
  faqJson: string;
  featured: boolean;
  busModel: string | null;
  busCount: number | null;
  blockedSeatsJson: string | null;
}): Trip {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    destination: row.destination,
    date: row.date,
    duration: row.duration,
    price: row.price,
    installments: row.installments,
    spotsTotal: row.spotsTotal,
    spotsLeft: row.spotsLeft,
    shortDescription: row.shortDescription,
    description: row.description,
    coverImage: row.coverImage,
    gallery: JSON.parse(row.galleryJson),
    hotel: row.hotelJson ? JSON.parse(row.hotelJson) : undefined,
    included: JSON.parse(row.includedJson),
    notIncluded: JSON.parse(row.notIncludedJson),
    mapEmbedUrl: row.mapEmbedUrl ?? undefined,
    itinerary: JSON.parse(row.itineraryJson),
    faq: JSON.parse(row.faqJson),
    featured: row.featured,
    busModel: (row.busModel ?? undefined) as Trip["busModel"],
    busCount: row.busCount ?? undefined,
    blockedSeats: row.blockedSeatsJson ? JSON.parse(row.blockedSeatsJson) : undefined,
  };
}

function tripToRow(t: Trip) {
  return {
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
  };
}

function bannerFromRow(row: {
  id: string;
  title: string;
  subtitle: string;
  price: string | null;
  image: string;
  tripSlug: string | null;
  order: number;
}): Banner {
  return {
    id: row.id,
    title: row.title,
    subtitle: row.subtitle,
    price: row.price ?? undefined,
    image: row.image,
    tripSlug: row.tripSlug ?? undefined,
    order: row.order,
  };
}

function bannerToRow(b: Banner) {
  return {
    id: b.id,
    title: b.title,
    subtitle: b.subtitle,
    price: b.price ?? null,
    image: b.image,
    tripSlug: b.tripSlug ?? null,
    order: b.order,
  };
}

function galleryFromRow(row: {
  id: string;
  image: string;
  caption: string | null;
  tripSlug: string | null;
  cover: boolean;
}): GalleryItem {
  return {
    id: row.id,
    image: row.image,
    caption: row.caption ?? undefined,
    tripSlug: row.tripSlug ?? undefined,
    cover: row.cover,
  };
}

function galleryToRow(g: GalleryItem) {
  return {
    id: g.id,
    image: g.image,
    caption: g.caption ?? null,
    tripSlug: g.tripSlug ?? null,
    cover: g.cover ?? false,
  };
}

function testimonialFromRow(row: {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  text: string;
  trip: string | null;
}): Testimonial {
  return {
    id: row.id,
    name: row.name,
    avatar: row.avatar,
    rating: row.rating,
    text: row.text,
    trip: row.trip ?? undefined,
  };
}

function reservationFromRow(row: {
  id: string;
  tripId: string;
  tripSlug: string;
  tripTitle: string;
  tripDate: string;
  name: string;
  email: string;
  phone: string;
  passengers: number;
  seatsJson: string | null;
  passengerDetailsJson: string | null;
  amount: number;
  transactionId: string | null;
  checkoutSlug: string | null;
  paymentMethod: string | null;
  status: string;
  spotsCounted: boolean;
  createdAt: string;
}): Reservation {
  return {
    id: row.id,
    tripId: row.tripId,
    tripSlug: row.tripSlug,
    tripTitle: row.tripTitle,
    tripDate: row.tripDate,
    name: row.name,
    email: row.email,
    phone: row.phone,
    passengers: row.passengers,
    seats: row.seatsJson ? JSON.parse(row.seatsJson) : undefined,
    passengerDetails: row.passengerDetailsJson
      ? JSON.parse(row.passengerDetailsJson)
      : undefined,
    amount: row.amount,
    transactionId: row.transactionId ?? undefined,
    checkoutSlug: row.checkoutSlug ?? undefined,
    paymentMethod: row.paymentMethod ?? undefined,
    status: row.status as Reservation["status"],
    spotsCounted: row.spotsCounted,
    createdAt: row.createdAt,
  };
}

function reservationToRow(r: Reservation) {
  return {
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
  };
}

function customerFromRow(row: {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  googleId: string | null;
  picture: string | null;
  sessionToken: string | null;
  createdAt: string;
  updatedAt: string;
}): Customer {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone ?? undefined,
    googleId: row.googleId ?? undefined,
    picture: row.picture ?? undefined,
    sessionToken: row.sessionToken ?? undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function customerToRow(c: Customer) {
  return {
    id: c.id,
    name: c.name,
    email: c.email,
    phone: c.phone ?? null,
    googleId: c.googleId ?? null,
    picture: c.picture ?? null,
    sessionToken: c.sessionToken ?? null,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  };
}

function manualBookingFromRow(row: {
  id: string;
  tripId: string;
  buyerName: string;
  phone: string | null;
  seatsJson: string;
  passengerDetailsJson: string;
  amount: number;
  paymentMethod: string;
  boardingPoint: string | null;
  notes: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  buyerDocument: string | null;
  buyerBirthDate: string | null;
  buyerAddress: string | null;
  buyerCep: string | null;
  installmentsJson: string | null;
}): ManualBooking {
  return {
    id: row.id,
    tripId: row.tripId,
    buyerName: row.buyerName,
    phone: row.phone ?? undefined,
    seats: JSON.parse(row.seatsJson),
    passengerDetails: JSON.parse(row.passengerDetailsJson),
    amount: row.amount,
    paymentMethod: row.paymentMethod as PaymentMethod,
    boardingPoint: row.boardingPoint ?? undefined,
    notes: row.notes ?? undefined,
    status: row.status as ManualBooking["status"],
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    buyerDocument: row.buyerDocument ?? undefined,
    buyerBirthDate: row.buyerBirthDate ?? undefined,
    buyerAddress: row.buyerAddress ?? undefined,
    buyerCep: row.buyerCep ?? undefined,
    installments: row.installmentsJson ? JSON.parse(row.installmentsJson) : undefined,
  };
}

function manualBookingToRow(b: ManualBooking) {
  return {
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
  };
}

function expenseFromRow(row: {
  id: string;
  tripId: string;
  description: string;
  category: string;
  amount: number;
  date: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}): Expense {
  return {
    id: row.id,
    tripId: row.tripId,
    description: row.description,
    category: row.category as ExpenseCategory,
    amount: row.amount,
    date: row.date ?? undefined,
    notes: row.notes ?? undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function expenseToRow(e: Expense) {
  return {
    id: e.id,
    tripId: e.tripId,
    description: e.description,
    category: e.category,
    amount: e.amount,
    date: e.date ?? null,
    notes: e.notes ?? null,
    createdAt: e.createdAt,
    updatedAt: e.updatedAt,
  };
}

// ---------------------------------------------------------------------------
// API pública — assinaturas idênticas à versão anterior baseada em arquivos
// JSON, para que nenhum dos 28 arquivos que importam daqui precise mudar.
// ---------------------------------------------------------------------------

export async function getTrips(): Promise<Trip[]> {
  const rows = await prisma.trip.findMany({ orderBy: { id: "asc" } });
  return rows.map(tripFromRow);
}

export async function getTripBySlug(slug: string): Promise<Trip | undefined> {
  const row = await prisma.trip.findUnique({ where: { slug } });
  return row ? tripFromRow(row) : undefined;
}

export async function saveTrips(trips: Trip[]): Promise<void> {
  const rows = trips.map(tripToRow);
  await prisma.$transaction([
    prisma.trip.deleteMany(),
    ...(rows.length ? [prisma.trip.createMany({ data: rows })] : []),
  ]);
}

export async function getBanners(): Promise<Banner[]> {
  const rows = await prisma.banner.findMany({ orderBy: { order: "asc" } });
  return rows.map(bannerFromRow);
}

export async function saveBanners(banners: Banner[]): Promise<void> {
  const rows = banners.map(bannerToRow);
  await prisma.$transaction([
    prisma.banner.deleteMany(),
    ...(rows.length ? [prisma.banner.createMany({ data: rows })] : []),
  ]);
}

export async function getGallery(): Promise<GalleryItem[]> {
  const rows = await prisma.galleryItem.findMany({ orderBy: { id: "asc" } });
  return rows.map(galleryFromRow);
}

export async function saveGallery(items: GalleryItem[]): Promise<void> {
  const rows = items.map(galleryToRow);
  await prisma.$transaction([
    prisma.galleryItem.deleteMany(),
    ...(rows.length ? [prisma.galleryItem.createMany({ data: rows })] : []),
  ]);
}

export async function getTestimonials(): Promise<Testimonial[]> {
  const rows = await prisma.testimonial.findMany({ orderBy: { id: "asc" } });
  return rows.map(testimonialFromRow);
}

// Reserva online "pendente" que não é paga neste prazo é cancelada
// automaticamente, liberando a poltrona. Ponto único de verdade: qualquer
// lugar que leia reservas via getReservations() já recebe o estado atualizado.
const PENDING_EXPIRY_MS = 15 * 60 * 1000;

export async function getReservations(): Promise<Reservation[]> {
  const rows = await prisma.reservation.findMany({ orderBy: { id: "asc" } });
  const items = rows.map(reservationFromRow);

  const now = Date.now();
  let changed = false;
  for (const r of items) {
    if (
      r.status === "pending" &&
      now - new Date(r.createdAt).getTime() > PENDING_EXPIRY_MS
    ) {
      r.status = "cancelled";
      changed = true;
    }
  }
  if (changed) await saveReservations(items);

  return items;
}

export async function saveReservations(items: Reservation[]): Promise<void> {
  const rows = items.map(reservationToRow);
  await prisma.$transaction([
    prisma.reservation.deleteMany(),
    ...(rows.length ? [prisma.reservation.createMany({ data: rows })] : []),
  ]);
}

export async function getCustomers(): Promise<Customer[]> {
  const rows = await prisma.customer.findMany({ orderBy: { id: "asc" } });
  return rows.map(customerFromRow);
}

export async function saveCustomers(items: Customer[]): Promise<void> {
  const rows = items.map(customerToRow);
  await prisma.$transaction([
    prisma.customer.deleteMany(),
    ...(rows.length ? [prisma.customer.createMany({ data: rows })] : []),
  ]);
}

export async function getManualBookings(): Promise<ManualBooking[]> {
  const rows = await prisma.manualBooking.findMany({ orderBy: { id: "asc" } });
  return rows.map(manualBookingFromRow);
}

export async function saveManualBookings(items: ManualBooking[]): Promise<void> {
  const rows = items.map(manualBookingToRow);
  await prisma.$transaction([
    prisma.manualBooking.deleteMany(),
    ...(rows.length ? [prisma.manualBooking.createMany({ data: rows })] : []),
  ]);
}

export async function getExpenses(): Promise<Expense[]> {
  const rows = await prisma.expense.findMany({ orderBy: { id: "asc" } });
  return rows.map(expenseFromRow);
}

export async function saveExpenses(items: Expense[]): Promise<void> {
  const rows = items.map(expenseToRow);
  await prisma.$transaction([
    prisma.expense.deleteMany(),
    ...(rows.length ? [prisma.expense.createMany({ data: rows })] : []),
  ]);
}

/**
 * Recalcula vagas totais/restantes de uma viagem a partir da ocupação real
 * do mapa de poltronas (bloqueios + reservas online ativas + vendas no
 * balcão), em vez de confiar em um número editado manualmente.
 */
export function computeLiveSpots(
  trip: Trip,
  reservations: Reservation[],
  manualBookings: ManualBooking[]
): Trip {
  const capacity = tripCapacity(trip);
  const occupied = occupiedSeatsForTrip(trip, reservations, manualBookings).size;
  return {
    ...trip,
    spotsTotal: capacity,
    spotsLeft: Math.max(0, capacity - occupied),
  };
}

export async function getTripsWithLiveSpots(): Promise<Trip[]> {
  const [trips, reservations, manualBookings] = await Promise.all([
    getTrips(),
    getReservations(),
    getManualBookings(),
  ]);
  return trips.map((t) => computeLiveSpots(t, reservations, manualBookings));
}

export async function getTripBySlugWithLiveSpots(
  slug: string
): Promise<Trip | undefined> {
  const trip = await getTripBySlug(slug);
  if (!trip) return undefined;
  const [reservations, manualBookings] = await Promise.all([
    getReservations(),
    getManualBookings(),
  ]);
  return computeLiveSpots(trip, reservations, manualBookings);
}
