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
        "group relative inline-flex h-12 items-center overflow-hidden rounded-full bg-foreground p-0.5 transition-transform w-[180px]",
        className
      )}
    >
      {/* Dynamic Section */}
      <div className="flex h-full w-80 items-center justify-center rounded-full bg-background px-6 transition-all duration-500 ease-in-out group-hover:w-full">
        <span className="font-primary text-sm font-black tracking-tight text-foreground whitespace-nowrap">
          {children}
        </span>
      </div>

      {/* Icon Section */}
      <div className="flex h-full w-10 items-center justify-center text-background transition-all duration-300 ease-in-out group-hover:w-0 group-hover:opacity-0 overflow-hidden">
        <ChevronRight className="h-5 w-5 flex-shrink-0" />
      </div>
    </Component>
  );
};
