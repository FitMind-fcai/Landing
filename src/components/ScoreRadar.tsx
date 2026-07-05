"use client";

import { motion } from "framer-motion";

const axes = ["Calorie", "BMI", "BPM", "Hydration", "Sleep", "Steps"];
const center = 100;
const radius = 78;

function point(index: number, value: number) {
  const angle = (Math.PI * 2 * index) / axes.length - Math.PI / 2;
  const r = radius * value;
  return [center + r * Math.cos(angle), center + r * Math.sin(angle)];
}

function polygon(values: number[]) {
  return values.map((v, i) => point(i, v).join(",")).join(" ");
}

const strength = [0.9, 0.85, 0.6, 0.7, 0.5, 0.65];
const agility = [0.6, 0.55, 0.9, 0.45, 0.6, 0.5];
const endurance = [0.4, 0.35, 0.5, 0.85, 0.4, 0.45];

export default function ScoreRadar() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-surface-2 p-5 text-foreground">
      <p className="font-display text-lg font-bold">Score</p>
      <svg viewBox="0 0 200 200" className="w-full max-w-[220px]">
        {[1, 0.75, 0.5, 0.25].map((scale) => (
          <polygon
            key={scale}
            points={polygon(axes.map(() => scale))}
            fill="none"
            stroke="var(--border)"
            strokeWidth={1}
          />
        ))}
        {axes.map((_, i) => {
          const [x, y] = point(i, 1);
          return (
            <line key={i} x1={center} y1={center} x2={x} y2={y} stroke="var(--border)" strokeWidth={1} />
          );
        })}

        {[
          { values: endurance, color: "#3b6fed" },
          { values: strength, color: "#ff6a1a" },
          { values: agility, color: "#171311" },
        ].map((series, i) => (
          <motion.polygon
            key={i}
            points={polygon(series.values)}
            fill={series.color}
            fillOpacity={0.18}
            stroke={series.color}
            strokeWidth={2}
            initial={{ opacity: 0, scale: 0.7 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: i * 0.15, ease: "easeOut" }}
            style={{ transformOrigin: "100px 100px" }}
          />
        ))}
      </svg>

      <motion.p
        className="font-display text-4xl font-extrabold text-brand"
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.4 }}
      >
        88
      </motion.p>
      <p className="text-xs text-muted">You are a healthy individual.</p>
    </div>
  );
}
