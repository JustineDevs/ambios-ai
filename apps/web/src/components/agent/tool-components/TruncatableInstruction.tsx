"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface TruncatableInstructionProps {
  text: string;
  className?: string;
  maxLines?: number;
}

export function TruncatableInstruction({
  text,
  className,
  maxLines = 3,
}: TruncatableInstructionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isTruncated, setIsTruncated] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (textRef.current) {
      // Check if content is taller than 3 lines (approx 4.5em at text-sm)
      setIsTruncated(textRef.current.scrollHeight > textRef.current.clientHeight + 2);
    }
  }, []);

  if (!text) return null;

  return (
    <div className={className}>
      <div
        ref={textRef}
        className={isExpanded ? "whitespace-pre-wrap" : undefined}
        style={
          !isExpanded
            ? {
                display: "-webkit-box",
                WebkitLineClamp: maxLines,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }
            : undefined
        }
      >
        {text}
      </div>
      {(isTruncated || isExpanded) && (
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="hover:!bg-transparent mt-1 flex cursor-pointer items-center gap-1 border-0 bg-transparent p-0 text-xs opacity-70 transition-opacity hover:opacity-100"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="h-3 w-3" />
              Show less
            </>
          ) : (
            <>
              <ChevronDown className="h-3 w-3" />
              Show more
            </>
          )}
        </button>
      )}
    </div>
  );
}
