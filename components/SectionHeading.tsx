import Reveal from "./Reveal";

export default function SectionHeading({
  label,
  title,
  subtitle,
  align = "center",
  light = false,
}: {
  label: string;
  title: string;
  subtitle?: string;
  align?: "center" | "left";
  light?: boolean;
}) {
  return (
    <Reveal
      className={`mb-12 max-w-2xl ${align === "center" ? "mx-auto text-center" : ""}`}
    >
      <p
        className={`section-label ${align === "center" ? "justify-center after:block after:h-px after:w-10 after:bg-gold" : ""}`}
      >
        {label}
      </p>
      <h2 className={`heading-display ${light ? "!text-white" : ""}`}>
        {title}
      </h2>
      {subtitle && (
        <p
          className={`mt-4 text-base leading-relaxed ${light ? "text-white/70" : "text-graphite/60"}`}
        >
          {subtitle}
        </p>
      )}
    </Reveal>
  );
}
