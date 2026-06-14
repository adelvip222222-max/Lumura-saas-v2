// src/components/ui/label.tsx
import React from "react";

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {}

export const Label = ({ className = "", ...props }: LabelProps) => {
  return (
    <label
      {...props}
      className={`block text-sm font-medium text-foreground mb-2 ${className}`}
    />
  );
};

export default Label;
