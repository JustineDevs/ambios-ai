import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import type React from "react";
import { useEffect, useId, useRef, useState } from "react";
import { useOutsideClick } from "@/hooks/use-outside-click";

export interface BentoGridProps {
  iconOnly?: boolean;
  instanceKey?: string;
  initialActiveId?: string | number;
  onClose?: () => void;
  iconOnlyClassName?: string;
  items: {
    id: string | number;
    title: string;
    subtitle?: string;
    description?: string;
    content: React.ReactNode;
    icon?: React.ReactNode;
    triggerIcon?: React.ReactNode;
    className?: string;
  }[];
}

export default function ExpandableBentoGrid({
  items,
  iconOnly = false,
  instanceKey,
  initialActiveId,
  onClose,
  iconOnlyClassName,
}: BentoGridProps) {
  const [active, setActive] = useState<(typeof items)[number] | boolean | null>(
    () => items.find((item) => item.id === initialActiveId) ?? null,
  );
  const ref = useRef<HTMLDivElement>(null);
  const id = useId();
  const layoutKey = instanceKey ?? id;

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setActive(false);
        onClose?.();
      }
    }

    if (active && typeof active === "object") {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [active, onClose]);

  useOutsideClick(ref, () => {
    setActive(null);
    onClose?.();
  });

  return (
    <>
      <AnimatePresence>
        {active && typeof active === "object" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none fixed inset-0 z-[10000] h-full w-full bg-black/20"
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {active && typeof active === "object" ? (
          <div className="pointer-events-none fixed inset-0 top-16 z-[10001] grid place-items-center px-4">
            <motion.div
              ref={ref}
              role="dialog"
              aria-modal="true"
              aria-label={active.title}
              className="pointer-events-auto relative flex h-full w-full max-w-[560px] flex-col overflow-hidden border border-border bg-background shadow-2xl sm:h-fit sm:max-h-[90%] sm:rounded-3xl"
            >
              <button
                type="button"
                aria-label="Close details"
                className="absolute top-3 right-3 z-20 flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background/90 text-foreground shadow-sm"
                onClick={() => {
                  setActive(null);
                  onClose?.();
                }}
              >
                <X className="h-4 w-4" />
              </button>
              <motion.div layoutId={`image-${active.title}-${layoutKey}`}>
                <div className="flex h-32 w-full items-center justify-center bg-muted/40 text-foreground md:h-40">
                  {active.icon ? (
                    <div className="scale-[1.6] text-primary">{active.icon}</div>
                  ) : (
                    <div className="h-full w-full bg-gray-200" />
                  )}
                </div>
              </motion.div>

              <div>
                <div className="flex items-center justify-between p-4">
                  <div className="">
                    <motion.h3
                      layoutId={`title-${active.title}-${layoutKey}`}
                      className="font-bold text-foreground md:text-sm"
                    >
                      {active.title}
                    </motion.h3>
                    <motion.p
                      layoutId={`description-${active.title}-${layoutKey}`}
                      className="text-balance text-[14px] text-muted-foreground"
                    >
                      {active.description}
                    </motion.p>
                  </div>
                </div>

                <div className="mx-auto flex justify-center overflow-auto px-4 pt-4">
                  <motion.div
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex h-40 flex-col items-start gap-4 overflow-y-auto pb-5 text-muted-foreground text-xs [scrollbar-width:none] md:h-fit md:text-sm lg:text-base"
                  >
                    {active.content}
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>
      <ul
        className={
          iconOnly
            ? "flex"
            : "mx-auto grid w-full max-w-4xl grid-cols-1 items-start gap-2 md:grid-cols-2 lg:grid-cols-3 lg:gap-4"
        }
      >
        {items.map((item) => (
          <motion.div
            layoutId={`card-${item.title}-${layoutKey}`}
            key={item.id}
            onClick={() => setActive(item)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setActive(item);
              }
            }}
            role="button"
            tabIndex={0}
            aria-label={iconOnly ? item.title : undefined}
            className={
              iconOnly
                ? `flex size-10 cursor-pointer items-center justify-center rounded-xl border border-border bg-primary/10 p-2 text-primary transition-colors hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${iconOnlyClassName ?? ""}`
                : "flex w-full cursor-pointer flex-col items-center justify-between rounded-xl border border-border bg-muted/20 p-4 transition-colors hover:bg-muted/50 md:flex-row"
            }
          >
            <div
              className={
                iconOnly
                  ? "flex items-center justify-center"
                  : "mx-auto flex flex-row items-center justify-center gap-3"
              }
            >
              <motion.div layoutId={`image-${item.title}-${layoutKey}`}>
                <div
                  className={
                    iconOnly
                      ? "flex items-center justify-center"
                      : "flex h-14 w-14 items-center justify-center rounded-lg bg-muted p-1 text-primary"
                  }
                >
                  {item.triggerIcon ?? item.icon}
                </div>
              </motion.div>
              {!iconOnly && (
                <div>
                  <motion.h3
                    layoutId={`title-${item.title}-${layoutKey}`}
                    className="text-left font-medium text-foreground"
                  >
                    {item.title}
                  </motion.h3>
                  <motion.p
                    layoutId={`description-${item.title}-${layoutKey}`}
                    className="text-left text-muted-foreground text-xs md:text-[14px]"
                  >
                    {item.subtitle}
                  </motion.p>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </ul>
    </>
  );
}
