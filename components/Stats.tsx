"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { siteConfig } from "@/lib/site-config";

function CountUp({ target, suffix }: { target: number; suffix: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const duration = 1800;
    const start = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 4);
      setValue(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, target]);

  return (
    <span ref={ref}>
      {value.toLocaleString("pt-BR")}
      {suffix}
    </span>
  );
}

export default function Stats() {
  return (
    <section className="relative overflow-hidden bg-graphite py-20">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 50%, #c9a24b 0%, transparent 40%), radial-gradient(circle at 80% 30%, #b5766b 0%, transparent 40%)",
        }}
      />
      <div className="container-site relative grid grid-cols-2 gap-10 lg:grid-cols-4">
        {siteConfig.stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.7, delay: i * 0.1 }}
            className="text-center"
          >
            <p className="font-[family-name:var(--font-display)] text-4xl font-semibold text-gold-light sm:text-5xl">
              <CountUp target={stat.value} suffix={stat.suffix} />
            </p>
            <p className="mt-2 text-xs uppercase tracking-[0.2em] text-white/50">
              {stat.label}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
