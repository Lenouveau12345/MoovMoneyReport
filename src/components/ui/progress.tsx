"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type ProgressProps = {
  value?: number;
  className?: string;
};

export function Progress({ value = 0, className }: ProgressProps) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className={cn("relative h-2 w-full overflow-hidden rounded-full bg-gray-200", className)}>
      <div
        className="h-full bg-orange-600 transition-all rounded-full"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
