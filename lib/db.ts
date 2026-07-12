import { promises as fs } from "fs";
import path from "path";
import type {
  Trip,
  Banner,
  GalleryItem,
  Testimonial,
  Reservation,
  Customer,
  ManualBooking,
  Expense,
} from "./types";
import { occupiedSeatsForTrip, tripCapacity } from "./bus";

const DATA_DIR = path.join(process.cwd(), "data");

async function readJson<T>(file: string): Promise<T> {
  const raw = await fs.readFile(path.join(DATA_DIR, file), "utf-8");
  return JSON.parse(raw) as T;
}

async function writeJson(file: string, data: unknown): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(
    path.join(DATA_DIR, file),
    JSON.stringify(data, null, 2),
    "utf-8"
  );
}

export async function getTrips(): Promise<Trip[]> {
  return readJson<Trip[]>("trips.json");
}

export async function getTripBySlug(slug: string): Promise<Trip | undefined> {
  const trips = await getTrips();
  return trips.find((t) => t.slug === slug);
}

export async function saveTrips(trips: Trip[]): Promise<void> {
  await writeJson("trips.json", trips);
}

export async function getBanners(): Promise<Banner[]> {
  const banners = await readJson<Banner[]>("banners.json");
  return banners.sort((a, b) => a.order - b.order);
}

export async function saveBanners(banners: Banner[]): Promise<void> {
  await writeJson("banners.json", banners);
}

export async function getGallery(): Promise<GalleryItem[]> {
  return readJson<GalleryItem[]>("gallery.json");
}

export async function saveGallery(items: GalleryItem[]): Promise<void> {
  await writeJson("gallery.json", items);
}

export async function getTestimonials(): Promise<Testimonial[]> {
  return readJson<Testimonial[]>("testimonials.json");
}

// Reserva online "pendente" que não é paga neste prazo é cancelada
// automaticamente, liberando a poltrona. Ponto único de verdade: qualquer
// lugar que leia reservas via getReservations() já recebe o estado atualizado.
const PENDING_EXPIRY_MS = 15 * 60 * 1000;

export async function getReservations(): Promise<Reservation[]> {
  let items: Reservation[];
  try {
    items = await readJson<Reservation[]>("reservations.json");
  } catch {
    return [];
  }

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
  await writeJson("reservations.json", items);
}

export async function getCustomers(): Promise<Customer[]> {
  try {
    return await readJson<Customer[]>("customers.json");
  } catch {
    return [];
  }
}

export async function saveCustomers(items: Customer[]): Promise<void> {
  await writeJson("customers.json", items);
}

export async function getManualBookings(): Promise<ManualBooking[]> {
  try {
    return await readJson<ManualBooking[]>("manual-bookings.json");
  } catch {
    return [];
  }
}

export async function saveManualBookings(items: ManualBooking[]): Promise<void> {
  await writeJson("manual-bookings.json", items);
}

export async function getExpenses(): Promise<Expense[]> {
  try {
    return await readJson<Expense[]>("expenses.json");
  } catch {
    return [];
  }
}

export async function saveExpenses(items: Expense[]): Promise<void> {
  await writeJson("expenses.json", items);
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
