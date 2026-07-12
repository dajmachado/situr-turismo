import type { Metadata } from "next";
import TripCard from "@/components/TripCard";
import PageHeader from "@/components/PageHeader";
import CtaBanner from "@/components/CtaBanner";
import Reveal from "@/components/Reveal";
import { getTripsWithLiveSpots } from "@/lib/db";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Próximas Viagens",
  description:
    "Confira as próximas excursões da SITUR Turismo: datas, valores, parcelamento e vagas disponíveis.",
  alternates: { canonical: "/viagens" },
};

export default async function TripsPage() {
  const trips = await getTripsWithLiveSpots();

  return (
    <>
      <PageHeader
        label="Próximas viagens"
        title="Destinos com saída confirmada"
        subtitle="Escolha sua próxima experiência. Vagas limitadas e parcelamento em até 10x sem juros."
      />
      <section className="container-site py-20">
        <div className="grid gap-7 md:grid-cols-2 lg:grid-cols-3">
          {trips.map((trip, i) => (
            <Reveal key={trip.id} delay={(i % 3) * 0.1}>
              <TripCard trip={trip} />
            </Reveal>
          ))}
        </div>
      </section>
      <CtaBanner
        title="Não encontrou o destino ideal?"
        subtitle="Fale com a nossa equipe — montamos roteiros exclusivos para grupos e empresas."
      />
    </>
  );
}
