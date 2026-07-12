export type Activity = {
  time?: string;
  title: string;
  description?: string;
  image?: string;
};

export type ItineraryDay = {
  day: number;
  title: string;
  city: string;
  description?: string;
  activities: Activity[];
  notes?: string;
  mapEmbedUrl?: string;
};

export type Faq = {
  question: string;
  answer: string;
};

export type Trip = {
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
  gallery: string[];
  hotel?: {
    name: string;
    description: string;
    image?: string;
  };
  included: string[];
  notIncluded: string[];
  mapEmbedUrl?: string;
  itinerary: ItineraryDay[];
  faq: Faq[];
  featured: boolean;
  busModel?: "dd43" | "exec46";
  busCount?: number;
  blockedSeats?: string[];
};

export type PassengerDetail = {
  seat: string;
  name: string;
  document?: string;
};

export type PaymentMethod =
  | "dinheiro"
  | "pix"
  | "cartao"
  | "transferencia"
  | "cortesia"
  | "parcelado";

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  dinheiro: "Dinheiro",
  pix: "Pix",
  cartao: "Cartão",
  transferencia: "Transferência",
  cortesia: "Cortesia",
  parcelado: "Pix Parcelado (Carnê)",
};

// Uma parcela do carnê de pagamento (Pix parcelado)
export type Installment = {
  id: string;
  number: number;
  dueDate: string; // dd/mm/aaaa
  amount: number;
  status: "pendente" | "pago";
  paidAt?: string; // dd/mm/aaaa
  paidAmount?: number;
  notes?: string;
};

// Venda registrada manualmente pela equipe (balcão / por fora do site)
export type ManualBooking = {
  id: string;
  tripId: string;
  buyerName: string;
  phone?: string;
  seats: string[];
  passengerDetails: PassengerDetail[];
  amount: number;
  paymentMethod: PaymentMethod;
  boardingPoint?: string;
  notes?: string;
  status: "pago" | "reservado";
  createdAt: string;
  updatedAt: string;
  // Dados do titular do carnê (Pix parcelado)
  buyerDocument?: string;
  buyerBirthDate?: string; // dd/mm/aaaa
  buyerAddress?: string;
  buyerCep?: string;
  installments?: Installment[];
};

export type Banner = {
  id: string;
  title: string;
  subtitle: string;
  price?: string;
  image: string;
  tripSlug?: string;
  order: number;
};

export type GalleryItem = {
  id: string;
  image: string;
  caption?: string;
  tripSlug?: string;
  cover?: boolean;
};

export type Reservation = {
  id: string;
  tripId: string;
  tripSlug: string;
  tripTitle: string;
  tripDate: string;
  name: string;
  email: string;
  phone: string;
  passengers: number;
  seats?: string[];
  passengerDetails?: PassengerDetail[];
  amount: number;
  transactionId?: string;
  checkoutSlug?: string;
  paymentMethod?: string;
  status: "pending" | "approved" | "rejected" | "cancelled";
  spotsCounted: boolean;
  createdAt: string;
};

export type ExpenseCategory =
  | "onibus"
  | "hospedagem"
  | "alimentacao"
  | "ingressos"
  | "guia"
  | "combustivel"
  | "pedagio"
  | "outros";

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  onibus: "Ônibus/Frota",
  hospedagem: "Hospedagem",
  alimentacao: "Alimentação",
  ingressos: "Ingressos",
  guia: "Guia/Equipe",
  combustivel: "Combustível",
  pedagio: "Pedágio",
  outros: "Outros",
};

// Despesa lançada manualmente pela equipe para apurar o lucro de uma viagem
export type Expense = {
  id: string;
  tripId: string;
  description: string;
  category: ExpenseCategory;
  amount: number;
  date?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type Customer = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  googleId?: string;
  picture?: string;
  sessionToken?: string;
  createdAt: string;
  updatedAt: string;
};

export type Testimonial = {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  text: string;
  trip?: string;
};
