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
        "group relative inline-flex h-12 items-center overflow-hidden rounded-full bg-foreground p-0.5 transition-transform",
        className
      )}
    >
      {/* Dynamic Section */}
      <div className="flex h-full items-center justify-center rounded-full bg-background px-6">
        <span className="font-primary text-sm font-black tracking-tight text-foreground">
          {children}
        </span>
      </div>

      {/* Icon Section */}
      <div className="flex h-full px-1 items-center justify-center text-background">
        <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
      </div>
    </Component>
  );
};
