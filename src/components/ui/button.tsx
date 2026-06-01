// src/components/ui/button.tsx
import React from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  loading?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive";
  asChild?: boolean;
}

export function Button({ 
  children, 
  className = "", 
  loading, 
  size = "md", 
  variant = "primary",
  disabled, 
  ...props 
}: ButtonProps) {
  // ✅ أحجام الزر
  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm rounded-lg",
    md: "px-4 py-2 text-sm rounded-lg",
    lg: "px-6 py-3 text-base rounded-xl",
  }[size];

  // ✅ أنماط الزر حسب النوع (أبيض وبرتقالي)
  const variantClasses = {
    primary:
      "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-sm hover:shadow-lg transition-all duration-200",
    secondary: "bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all duration-200",
    outline: "border-2 border-orange-500 text-orange-600 hover:bg-orange-50 transition-all duration-200",
    ghost: "text-gray-600 hover:bg-gray-100 hover:text-orange-500 transition-all duration-200",
    destructive: "bg-red-500 hover:bg-red-600 text-white transition-all duration-200",
  }[variant];

  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center font-medium transition-all duration-200 transform-gpu",
        "focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2",
        "disabled:opacity-60 disabled:cursor-not-allowed",
        sizeClasses,
        variantClasses,
        className
      )}
    >
      {loading && (
        <svg
          className="ml-2 h-4 w-4 animate-spin"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}

export default Button;