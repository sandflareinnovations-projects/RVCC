import { ReactNode } from "react";

import { cn } from "@lib/utils";

interface ButtonProps {
  children: ReactNode;
  className?: string;
  href?: string;
}

export const Button = ({ children, className, href }: ButtonProps) => {
  const baseStyles =
    "inline-flex h-10 items-center justify-center rounded-md border px-6 text-sm font-medium transition-colors hover:bg-zinc-100";

  const Component = href ? "a" : "button";

  return (
    <Component href={href} className={cn(baseStyles, className)}>
      {children}
    </Component>
  );
};
