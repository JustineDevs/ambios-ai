"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { NOTIF_BLUE } from "./bot/decor";
import { BotEngine, type BotFrame } from "./bot/engine";
import { DEFAULT_EXPRESSION, EXPRESSION_BY_ID } from "./bot/expressions";
import { clamp, easings } from "./bot/math";
import { DEMI_VIEWBOX, RAYON } from "./bot/repere";
import { COLOR_BY_ID, DEFAULT_COLOR, DEFAULT_SHAPE, mixHex, SHAPE_BY_ID } from "./bot/skins";
import { STATE_BY_ID, type StateId } from "./bot/states";
import { lookTarget, TURN_TIME } from "./ui/gaze";

export type BloubState = "idle" | "thinking" | "working" | "searching" | "connecting" | "approval";

const STATE_MAP: Record<BloubState, StateId> = {
  idle: "idle",
  thinking: "thinking",
  working: "orbit",
  searching: "orbit",
  connecting: "comet",
  approval: "alert",
};

export function BloubBot({
  state = "idle",
  size = 20,
  className,
  follow = false,
  label = "AmbiOS agent status",
}: {
  state?: BloubState;
  size?: number;
  className?: string;
  follow?: boolean;
  label?: string;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const engineRef = useRef<BotEngine | null>(null);
  const clockRef = useRef(0);
  const lastRef = useRef(0);
  const pointerRef = useRef<{ x: number; y: number } | null>(null);
  const aimingRef = useRef(false);
  const turnSinceRef = useRef(0);
  const [frame, setFrame] = useState<BotFrame | null>(null);
  const [isDark, setIsDark] = useState(false);
  const mappedState = STATE_MAP[state];
  const darkInk = COLOR_BY_ID.get(DEFAULT_COLOR)?.hex ?? "#0a0a0c";
  // The masked `ink` layer is the visible body; `paper` remains visible through
  // the eye cut-outs. Keep the assistant mono and invert the body with the theme.
  const ink = isDark ? "#ffffff" : darkInk;
  const paper = isDark ? darkInk : "#ffffff";
  const maskId = useId().replace(/:/g, "");
  const gradientId = (id: string) => `${maskId}-${id}`;

  const shape = useMemo(() => SHAPE_BY_ID.get(DEFAULT_SHAPE)?.radii ?? null, []);
  const expression = useMemo(() => EXPRESSION_BY_ID.get(DEFAULT_EXPRESSION) ?? null, []);

  useEffect(() => {
    const root = document.documentElement;
    const updateTheme = () => setIsDark(root.classList.contains("dark"));
    updateTheme();
    const observer = new MutationObserver(updateTheme);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const engine = new BotEngine(RAYON, mappedState, shape, expression);
    engineRef.current = engine;
    setFrame(engine.sample(0));
    clockRef.current = 0;
    lastRef.current = 0;
  }, [expression, mappedState, shape]);

  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      setFrame(engine.sample(0));
      return;
    }
    let raf = 0;
    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== "touch")
        pointerRef.current = { x: event.clientX, y: event.clientY };
    };
    const onLeave = () => {
      pointerRef.current = null;
    };
    if (follow) window.addEventListener("pointermove", onMove);
    const tick = (ms: number) => {
      const dt = lastRef.current ? Math.min((ms - lastRef.current) / 1000, 0.064) : 0;
      lastRef.current = ms;
      clockRef.current += dt;
      const now = clockRef.current;
      if (follow && STATE_BY_ID.get(mappedState)?.baseFace) {
        const box = svgRef.current?.getBoundingClientRect();
        if (box && box.width > 0 && box.height > 0) {
          if (!aimingRef.current) turnSinceRef.current = now;
          const nx = pointerRef.current
            ? (pointerRef.current.x - (box.left + box.width / 2)) /
              Math.max(1, window.innerWidth / 2)
            : 0;
          const ny = pointerRef.current
            ? (pointerRef.current.y - (box.top + box.height / 2)) /
              Math.max(1, window.innerHeight / 2)
            : 0;
          engine.setLook(
            lookTarget({
              nx: clamp(nx, -1, 1),
              ny: clamp(ny, -1, 1),
              tour: easings.easeOutQuint(clamp((now - turnSinceRef.current) / TURN_TIME)),
              pointer: pointerRef.current !== null,
            }),
            now,
          );
          aimingRef.current = true;
        }
      } else if (aimingRef.current) {
        engine.setLook(null, now, TURN_TIME);
        aimingRef.current = false;
      }
      setFrame(engine.sample(now));
      raf = requestAnimationFrame(tick);
    };
    if (follow) document.addEventListener("pointerleave", onLeave);
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      if (follow) window.removeEventListener("pointermove", onMove);
      if (follow) document.removeEventListener("pointerleave", onLeave);
    };
  }, [follow, mappedState]);

  if (!frame)
    return <span aria-hidden className={className} style={{ width: size, height: size }} />;
  return (
    <svg
      ref={svgRef}
      width={size}
      height={size}
      viewBox={`${-DEMI_VIEWBOX} ${-DEMI_VIEWBOX} ${DEMI_VIEWBOX * 2} ${DEMI_VIEWBOX * 2}`}
      role="img"
      aria-label={label}
      className={className}
    >
      <defs>
        <mask
          id={maskId}
          maskUnits="userSpaceOnUse"
          x={-DEMI_VIEWBOX}
          y={-DEMI_VIEWBOX}
          width={DEMI_VIEWBOX * 2}
          height={DEMI_VIEWBOX * 2}
        >
          <path d={frame.bodyPath} fill="#fff" />
          {frame.eyes.map((eye, index) => (
            <path
              key={`${eye.d}-${eye.matrix}`}
              d={eye.d}
              transform={eye.matrix}
              opacity={eye.alpha}
              fill="#000"
            />
          ))}
          {frame.notch && (
            <circle cx={frame.notch.x} cy={frame.notch.y} r={frame.notch.r} fill="#000" />
          )}
        </mask>
        {frame.arcs.map((arc) => (
          <linearGradient
            key={arc.id}
            id={gradientId(arc.id)}
            gradientUnits="userSpaceOnUse"
            x1={arc.grad.x1}
            y1={arc.grad.y1}
            x2={arc.grad.x2}
            y2={arc.grad.y2}
          >
            {arc.grad.stops.map((color, index) => (
              <stop
                key={`${color}-${arc.id}`}
                offset={index / Math.max(1, arc.grad.stops.length - 1)}
                stopColor={color}
              />
            ))}
          </linearGradient>
        ))}
      </defs>
      <g fill="none" strokeLinecap="round">
        {frame.arcs.map((arc) => (
          <path
            key={`back-${arc.id}`}
            d={arc.back}
            stroke={`url(#${gradientId(arc.id)})`}
            strokeWidth={arc.width}
            opacity={arc.opacity}
          />
        ))}
      </g>
      {frame.dotsBehind && <Dots frame={frame} paper={paper} ink={ink} />}
      <g opacity={frame.bodyAlpha}>
        <path d={frame.bodyPath} fill={paper} />
        <g mask={`url(#${maskId})`}>
          <rect
            x={-DEMI_VIEWBOX}
            y={-DEMI_VIEWBOX}
            width={DEMI_VIEWBOX * 2}
            height={DEMI_VIEWBOX * 2}
            fill={ink}
          />
        </g>
      </g>
      {!frame.dotsBehind && <Dots frame={frame} paper={paper} ink={ink} />}
      {frame.notif && (
        <circle cx={frame.notif.x} cy={frame.notif.y} r={frame.notif.r} fill={NOTIF_BLUE} />
      )}
      <g fill="none" strokeLinecap="round">
        {frame.arcs.map((arc) => (
          <path
            key={`front-${arc.id}`}
            d={arc.front}
            stroke={`url(#${gradientId(arc.id)})`}
            strokeWidth={arc.width}
            opacity={arc.opacity}
          />
        ))}
      </g>
    </svg>
  );
}

function Dots({ frame, paper, ink }: { frame: BotFrame; paper: string; ink: string }) {
  return (
    <g>
      {frame.dots.map((dot, index) => {
        const fill = dot.color ?? (dot.depth === undefined ? ink : mixHex(paper, ink, dot.depth));
        return dot.d ? (
          <path
            key={`${dot.x}-${dot.y}-${dot.d ?? dot.r}`}
            d={dot.d}
            fill={fill}
            opacity={dot.opacity}
            transform={`translate(${dot.x} ${dot.y}) rotate(${dot.rot ?? 0}) scale(${RAYON})`}
          />
        ) : (
          <circle
            key={`${dot.x}-${dot.y}-${dot.r}`}
            cx={dot.x}
            cy={dot.y}
            r={dot.r}
            fill={fill}
            opacity={dot.opacity}
          />
        );
      })}
    </g>
  );
}
