import Reveal from "./Reveal";

export default function PageHeader({
  label,
  title,
  subtitle,
}: {
  label: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <section className="relative overflow-hidden bg-blush-light">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(circle at 85% 20%, rgba(201,162,75,0.18) 0%, transparent 45%), radial-gradient(circle at 10% 90%, rgba(181,118,107,0.15) 0%, transparent 45%)",
        }}
      />
      <div className="container-site relative py-20 text-center">
        <Reveal>
          <p className="section-label justify-center">{label}</p>
          <h1 className="heading-display">{title}</h1>
          {subtitle && (
            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-graphite/60">
              {subtitle}
            </p>
          )}
        </Reveal>
      </div>
    </section>
  );
}
