import { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface ButtonProps {
  children: ReactNode;
  className?: string;
  variant?: "primary" | "glass";
  href?: string;
}

export const Button = ({ children, className, variant = "primary", href }: ButtonProps) => {
  const baseStyles =
    "inline-flex h-12 items-center justify-center rounded-full px-8 text-sm font-semibold transition-all";
  const variants = {
    primary: "bg-white text-black hover:scale-105",
    glass: "glass text-white hover:bg-white/10",
  };

  const Component = href ? "a" : "button";

  return (
    <Component href={href} className={cn(baseStyles, variants[variant], className)}>
      {children}
    </Component>
  );
};
