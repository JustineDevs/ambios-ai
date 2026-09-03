"use client";

import { type RefObject, useEffect } from "react";

export function useOutsideClick<T extends HTMLElement>(
  ref: RefObject<T | null>,
  onOutside: () => void,
) {
  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (target instanceof Node && !ref.current?.contains(target)) onOutside();
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [onOutside, ref]);
}
