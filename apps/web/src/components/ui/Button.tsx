"use client";

import { ReactNode } from "react";
import { ChevronRight } from "lucide-react";

import { cn } from "@lib/utils";

interface ButtonProps {
  children: ReactNode;
  className?: string;
  href?: string;
  onClick?: () => void;
}

export const Button = ({ children, className, href, onClick }: ButtonProps) => {
  const Component = href ? "a" : "button";

  return (
    <Component
      href={href}
      onClick={onClick}
      className={cn(
        "group relative inline-flex items-center justify-between rounded-full border border-brand-black bg-brand-white py-1.5 pl-8 pr-1.5 transition-all hover:bg-zinc-50 active:scale-95",
        className
      )}
    >
      <span className="font-primary text-sm font-bold tracking-tight text-brand-black">
        {children}
      </span>
      <div className="ml-4 flex h-8 w-8 items-center justify-center rounded-full bg-brand-black text-brand-white transition-all group-hover:translate-x-1">
        <ChevronRight className="h-4 w-4" />
      </div>
    </Component>
  );
};
