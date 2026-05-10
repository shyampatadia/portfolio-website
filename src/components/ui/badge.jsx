import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex max-w-full items-center rounded-full border px-3 py-1 text-xs font-medium leading-tight tracking-[0.04em] transition-colors",
  {
    variants: {
      variant: {
        default: "border-slate-200 bg-[rgba(255,252,246,0.86)] text-slate-700",
        subtle: "border-emerald-200 bg-emerald-50/90 text-emerald-900",
        accent: "border-orange-200 bg-orange-50 text-orange-800",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({ className, variant, ...props }) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
