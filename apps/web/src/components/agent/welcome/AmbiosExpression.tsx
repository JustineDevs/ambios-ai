"use client";

import { useEffect, useState } from "react";

type Expression = {
  name: string;
  message: string;
  eyeWidth: number;
  eyeHeight: number;
  eyeTilt: number;
  gap: number;
  faceY: number;
  orb: string;
};

const EXPRESSIONS: Expression[] = [
  {
    name: "neutre",
    message: "Ready when you are.",
    eyeWidth: 18,
    eyeHeight: 42,
    eyeTilt: 0,
    gap: 17,
    faceY: 0,
    orb: "from-slate-200 via-white to-slate-300",
  },
  {
    name: "attentif",
    message: "I’m listening.",
    eyeWidth: 17,
    eyeHeight: 45,
    eyeTilt: -4,
    gap: 16,
    faceY: 1,
    orb: "from-cyan-200 via-white to-blue-200",
  },
  {
    name: "curieux",
    message: "What should we explore?",
    eyeWidth: 19,
    eyeHeight: 43,
    eyeTilt: -12,
    gap: 16,
    faceY: -1,
    orb: "from-violet-200 via-white to-fuchsia-200",
  },
  {
    name: "heureux",
    message: "Let’s make it happen.",
    eyeWidth: 24,
    eyeHeight: 16,
    eyeTilt: 14,
    gap: 17,
    faceY: 2,
    orb: "from-amber-200 via-white to-orange-200",
  },
  {
    name: "surpris",
    message: "There’s a lot we can do.",
    eyeWidth: 28,
    eyeHeight: 31,
    eyeTilt: 0,
    gap: 19,
    faceY: -1,
    orb: "from-emerald-200 via-white to-teal-200",
  },
  {
    name: "excite",
    message: "Let’s get started.",
    eyeWidth: 25,
    eyeHeight: 39,
    eyeTilt: -10,
    gap: 19,
    faceY: -2,
    orb: "from-pink-200 via-white to-rose-200",
  },
];

export function AmbiosExpression() {
  const [index, setIndex] = useState(0);
  const expression = EXPRESSIONS[index];

  useEffect(() => {
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % EXPRESSIONS.length);
    }, 3200);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col items-center gap-3" aria-live="polite">
      <div
        className={`relative size-20 rounded-full bg-gradient-to-br ${expression.orb} shadow-[0_12px_35px_-16px_rgba(14,165,233,0.55)] transition-all duration-700 ease-out`}
        style={{ transform: `translateY(${expression.faceY}px)` }}
        aria-hidden="true"
      >
        <div
          className="absolute inset-x-0 top-1/2 flex -translate-y-1/2 items-center justify-center transition-all duration-700 ease-out"
          style={{ gap: `${expression.gap}px` }}
        >
          {["left", "right"].map((eye) => (
            <span
              key={eye}
              className="block rounded-full bg-slate-900 transition-all duration-700 ease-out"
              style={{
                width: `${expression.eyeWidth}px`,
                height: `${expression.eyeHeight}px`,
                transform: `rotate(${eye === "left" ? expression.eyeTilt : -expression.eyeTilt}deg)`,
              }}
            />
          ))}
        </div>
      </div>
      <div className="h-7 overflow-hidden text-center">
        <p
          key={expression.name}
          className="fade-in slide-in-from-bottom-2 animate-in font-normal text-2xl text-muted-foreground/50 duration-700"
        >
          {expression.message}
        </p>
      </div>
    </div>
  );
}
