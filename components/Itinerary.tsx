"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { MapPin, Clock, Info, ChevronDown } from "lucide-react";
import type { ItineraryDay } from "@/lib/types";

export default function Itinerary({ days }: { days: ItineraryDay[] }) {
  const [active, setActive] = useState(0);
  if (days.length === 0) return null;
  const day = days[active];

  return (
    <div>
      {/* Day selector */}
      <div className="sticky top-[72px] z-20 -mx-5 mb-10 overflow-x-auto bg-ice/85 px-5 py-3 backdrop-blur-xl sm:mx-0 sm:px-0">
        <div className="flex gap-3">
          {days.map((d, i) => (
            <button
              key={d.day}
              onClick={() => setActive(i)}
              className={`relative shrink-0 rounded-full px-6 py-3 text-sm font-semibold transition-all duration-300 ${
                i === active
                  ? "text-white"
                  : "bg-white text-graphite/60 shadow-soft hover:text-graphite"
              }`}
            >
              {i === active && (
                <motion.span
                  layoutId="day-pill"
                  className="absolute inset-0 rounded-full bg-rose shadow-lifted"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}
              <span className="relative">Dia {d.day}</span>
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={day.day}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -24 }}
          transition={{ duration: 0.45, ease: [0.21, 0.47, 0.32, 0.98] }}
        >
          {/* Day header */}
          <div className="mb-10">
            <p className="flex items-center gap-2 text-sm font-medium text-gold-dark">
              <MapPin size={15} />
              {day.city}
            </p>
            <h3 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold text-graphite sm:text-3xl">
              Dia {day.day} — {day.title}
            </h3>
            {day.description && (
              <p className="mt-3 max-w-2xl leading-relaxed text-graphite/60">
                {day.description}
              </p>
            )}
          </div>

          {/* Timeline */}
          <div className="relative ml-3 border-l-2 border-dashed border-rose/30 pl-8 sm:ml-6 sm:pl-12">
            {day.activities.map((activity, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.55, delay: i * 0.06 }}
                className="relative pb-10 last:pb-0"
              >
                {/* Timeline node */}
                <span className="absolute -left-[41px] top-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-gold bg-ice sm:-left-[57px]">
                  <span className="h-2 w-2 rounded-full bg-gold" />
                </span>

                <div className="card-hover overflow-hidden rounded-3xl bg-white shadow-soft">
                  <div className="flex flex-col sm:flex-row">
                    {activity.image && (
                      <div className="relative h-44 w-full shrink-0 sm:h-auto sm:w-56">
                        <Image
                          src={activity.image}
                          alt={activity.title}
                          fill
                          sizes="(max-width: 640px) 100vw, 224px"
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1 p-6">
                      {activity.time && (
                        <span className="mb-2.5 inline-flex items-center gap-1.5 rounded-full bg-blush px-3 py-1 text-xs font-semibold text-rose-dark">
                          <Clock size={12} />
                          {activity.time}
                        </span>
                      )}
                      <h4 className="font-[family-name:var(--font-display)] text-lg font-semibold text-graphite">
                        {activity.title}
                      </h4>
                      {activity.description && (
                        <p className="mt-2 text-sm leading-relaxed text-graphite/60">
                          {activity.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Notes */}
          {day.notes && (
            <div className="mt-10 flex items-start gap-3.5 rounded-3xl border border-gold/25 bg-gold/8 p-6">
              <Info size={18} className="mt-0.5 shrink-0 text-gold-dark" />
              <div>
                <p className="text-sm font-semibold text-graphite">
                  Observações do dia
                </p>
                <p className="mt-1 text-sm leading-relaxed text-graphite/65">
                  {day.notes}
                </p>
              </div>
            </div>
          )}

          {/* Map */}
          {day.mapEmbedUrl && (
            <div className="mt-8 overflow-hidden rounded-3xl shadow-soft">
              <iframe
                src={day.mapEmbedUrl}
                title={`Mapa — Dia ${day.day}`}
                className="h-72 w-full"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          )}

          {active < days.length - 1 && (
            <button
              onClick={() => setActive(active + 1)}
              className="group mx-auto mt-12 flex items-center gap-2 text-sm font-semibold text-rose transition-colors hover:text-rose-dark"
            >
              Ver o Dia {days[active + 1].day}
              <ChevronDown
                size={16}
                className="transition-transform group-hover:translate-y-0.5"
              />
            </button>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
