"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface SwitchProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "onChange"> {
  label?: React.ReactNode;
  onCheckedChange?: (checked: boolean) => void;
}

export const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  (
    {
      label,
      className = "",
      checked,
      defaultChecked,
      onCheckedChange,
      disabled,
      id,
      ...props
    },
    ref
  ) => {
    const inputId =
      id ?? `switch-${React.useId().replace(/:/g, "")}`;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onCheckedChange?.(e.target.checked);
    };

    return (
      <div className={cn("inline-flex items-center gap-2", className)}>
        <label
          htmlFor={inputId}
          className={cn(
            "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors",
            disabled && "cursor-not-allowed opacity-50"
          )}
        >
          <input
            id={inputId}
            type="checkbox"
            ref={ref}
            className="peer sr-only"
            checked={checked}
            defaultChecked={defaultChecked}
            disabled={disabled}
            onChange={handleChange}
            {...props}
          />
          <span
            className={cn(
              "block h-6 w-11 rounded-full bg-gray-200 transition-colors",
              "peer-checked:bg-orange-500 peer-focus-visible:ring-2 peer-focus-visible:ring-orange-300"
            )}
          />
          <span
            className={cn(
              "pointer-events-none absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
              "peer-checked:translate-x-5"
            )}
          />
        </label>
        {label && (
          <span className="text-sm text-foreground">{label}</span>
        )}
      </div>
    );
  }
);

Switch.displayName = "Switch";

export default Switch;
