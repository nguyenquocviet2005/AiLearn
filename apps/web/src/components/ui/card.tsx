import type * as React from "react";

import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.ComponentProps<"section">) {
  return (
    <section
      className={cn(
        "rounded-3xl border border-[var(--line)] bg-white shadow-[0_18px_60px_rgba(26,41,38,0.08)]",
        className,
      )}
      {...props}
    />
  );
}
