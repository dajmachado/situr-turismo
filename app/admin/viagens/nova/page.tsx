import TripForm from "@/components/admin/TripForm";

export default function NewTripPage() {
  return (
    <div>
      <h1 className="mb-8 font-[family-name:var(--font-display)] text-3xl font-semibold text-graphite">
        Nova viagem
      </h1>
      <TripForm />
    </div>
  );
}
