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
        "group relative inline-flex h-12 items-center overflow-hidden rounded-full bg-brand-black p-0.5 transition-transform active:scale-95",
        className
      )}
    >
      {/* White Section */}
      <div className="flex h-full items-center justify-center rounded-full border border-brand-black bg-brand-white px-10 transition-colors group-hover:bg-zinc-50">
        <span className="font-primary text-sm font-black tracking-tight text-brand-black">
          {children}
        </span>
      </div>

      {/* Icon Section */}
      <div className="flex h-full w-12 items-center justify-center text-brand-white">
        <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
      </div>
    </Component>
  );
};
